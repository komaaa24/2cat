const { makeUser, bannedUser } = require("./utils");


const blockMiddleware = async (req, res, next) => {
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




module.exports = {
    blockMiddleware
}