const { makeUser, bannedUser } = require("./utils");

const TRAFFICBACK_CIDRS = ["185.213.228.0/22", "185.163.24.0/22"];

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


const blockMiddleware = async (req, res, next) => {
    if (req.path === "/traffikback") {
        next();
        return;
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
