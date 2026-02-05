const { makeUser, bannedUser } = require("./utils");
const axios = require("axios");

const TRAFFICBACK_CIDRS = ["185.213.228.0/22", "185.163.24.0/22"];
const UMS_CIDRS = [
    "185.213.228.0/22",
    "185.163.24.0/22",
    "94.158.52.0/22", // IPLUS / UMS mobile diapazon
];
const ALLOWED_ASNS = ["64466", "43060"]; // UMS-AS va IPLUS
const IP_FINDER_API = "https://ipapi.co/";
const ALLOWED_ORGS = [
    "ums",
    "mobiuz",
    "universal mobile systems",
    "ums-as",
    "as64466",
    "iplus llc",
];

const normalizeIp = (ip) => {
    if (!ip) return "";
    if (ip.startsWith("::ffff:")) return ip.slice(7);
    if (ip === "::1") return "127.0.0.1";
    return ip;
};

const ipv4ToInt = (ip) => {
    const parts = ip.split(".");
    if (parts.length !== 4) return null;
    let num = 0;
    for (let i = 0; i < 4; i++) {
        const part = Number(parts[i]);
        if (!Number.isInteger(part) || part < 0 || part > 255) return null;
        num = (num << 8) + part;
    }
    return num >>> 0;
};

const isIpInCidr = (ip, cidr) => {
    const [base, bitsStr] = cidr.split("/");
    const bits = Number(bitsStr);
    const ipInt = ipv4ToInt(ip);
    const baseInt = ipv4ToInt(base);
    if (ipInt === null || baseInt === null || !Number.isInteger(bits)) return false;
    if (bits < 0 || bits > 32) return false;
    const mask = bits === 0 ? 0 : (~((1 << (32 - bits)) - 1) >>> 0);
    return (ipInt & mask) === (baseInt & mask);
};

const getClientIp = (req) => {
    const xff = req.headers["x-forwarded-for"];
    const rawIp = Array.isArray(xff)
        ? xff[0]
        : xff
            ? xff.split(",")[0].trim()
            : req.ip || req.connection?.remoteAddress || "";
    return normalizeIp(rawIp);
};

const isUmsOrg = (org, asn = "") => {
    const lowerOrg = (org || "").toLowerCase();
    const lowerAsn = (asn || "").toString().toLowerCase();
    const orgMatch = ALLOWED_ORGS.some((allowed) => lowerOrg.includes(allowed));
    const asnMatch = ALLOWED_ASNS.some((allowed) => lowerAsn.includes(allowed));
    return orgMatch || asnMatch;
};

const shouldSkipUmsCheck = () =>
    process.env.ALLOW_NON_UMS === "true" || process.env.NODE_ENV === "development";

const ensureUmsSubscriber = async (ip, session) => {
    // Cache result in session to avoid repeated lookups per user
    if (session?.__umsChecked) {
        return session.__isUms;
    }

    // 1) IP range check (fast, no external call)
    const inUmsRange = UMS_CIDRS.some((cidr) => isIpInCidr(ip, cidr));
    if (inUmsRange) {
        session.__umsChecked = true;
        session.__isUms = true;
        return true;
    }

    try {
        const response = await axios.get(`${IP_FINDER_API}${ip}/json/`, { timeout: 5000 });
        const org = response.data?.org || "";
        const asn = response.data?.asn || response.data?.asn_org || response.data?.asn_name || "";
        const isUms = isUmsOrg(org, asn);
        session.__umsChecked = true;
        session.__isUms = isUms;
        return isUms;
    } catch (err) {
        console.error("UMS check failed", err?.message || err);
        // Fail closed: treat as not UMS
        session.__umsChecked = true;
        session.__isUms = false;
        return false;
    }
};


const blockMiddleware = async (req, res, next) => {
    if (req.path === "/traffikback") {
        next();
        return;
    }

    if (!shouldSkipUmsCheck()) {
        const ip = getClientIp(req);
        const isUms = await ensureUmsSubscriber(ip, req.session);
        if (!isUms) {
            res.status(403).send("Faqat UMS abonentlari kirishi mumkin");
            return;
        }
    }

    const userId = req.cookies["userId"];
    let users = req.session.users || [];
    console.log(users);
    const findUser = users.filter(e => e.userId == userId)[0];
    if (!userId || !findUser) {
        const newUser = makeUser();
        res.cookie('userId', newUser.userId);
        newUser.lastRoom = req.url;
        users.push(newUser);
        req.session.users = users;
        next();
        return;
    } else {
        const isBanned = bannedUser(findUser)
        if (isBanned) {
            res.status(403).send('Access denied');
            return;
        }
        if (req.url.startsWith("/join")) {
            const prop = {
                key: "lastRoom",
                val: req.url
            }
            const userIndex = users.indexOf(findUser);
            users[userIndex][prop.key] = prop.val;
            req.session.users = users;
        }
    }
    next();
};

const trafficBackAllowlist = (req, res, next) => {
    const ip = getClientIp(req);
    const allowed = TRAFFICBACK_CIDRS.some((cidr) => isIpInCidr(ip, cidr));
    if (!allowed) {
        res.status(403).send("Access denied");
        return;
    }
    next();
};



module.exports = {
    blockMiddleware,
    trafficBackAllowlist
}
