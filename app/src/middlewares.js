const { addUser, getUsers, updateUser } = require("../db/controllers");
const configs = require("./config");
const { makeUser, bannedUser } = require("./utils");


const blockMiddleware = async (req, res, next) => {
    const userId = req.cookies["userId"];
    const users = await getUsers();
    const updatedUser = users.filter(e => e.userId == userId)[0];
    if (!userId || !updatedUser) {
        const newUser = makeUser();
        res.cookie('userId', newUser.userId);
        newUser.lastRoom = req.url;
        await addUser(newUser);
        next();
        return;
    } else {
        const isBanned = bannedUser(updatedUser)
        if (isBanned) {
            res.status(403).send('Access denied');
            return;
        }
        if (req.url.startsWith("/join")) {
            const prop = {
                key: "lastRoom",
                val: req.url
            }
            await updateUser(userId, prop);
        }
    }
    next();
};




module.exports = {
    blockMiddleware
}