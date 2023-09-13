const { writeFile, readFile } = require("fs/promises");
const path = require("path");
const { makeUser } = require("../src/utils");


const PATH = path.join(__dirname, "database.json");



const usersSchema = {
    userId: "string",
    userStatus: "free" || "banned",
    lastRoom: "/join/somewhere"
}

/**
 * 
 * @param {usersSchema} user 
 * @returns 
 */
const addUser = async (user) => {
    try {
        const data = await readFile(PATH);
        const parsedData = JSON.parse(data);
        parsedData.push(user);
        await writeFile(PATH, JSON.stringify(parsedData, null, 2));
        console.log("User has been added");
        return true;
    } catch (err) {
        console.log(`Error while adding user to the db\n`, err);
        return false;
    }
}



const getUsers = async () => {
    try {
        const data = await readFile(PATH);
        const parsedData = await JSON.parse(data);
        return parsedData;
    } catch (err) {
        console.log(`Error while adding user to the db\n`, err);
        return false;
    }
}



const propParam = {
    key: "string",
    val: "string"
}
/**
 * 
 * @param {string} userId 
 * @param {propParam } prop 
 * @returns true | false
 */
const updateUser = async (userId, prop) => {
    try {
        const data = await getUsers();
        let ans = [];
        for (let i = 0; i < data.length; i++) {
            if (data[i]["userId"] == userId) {
                let updatedUser = Object.assign({}, data[i]);
                updatedUser[prop.key] = prop.val;
                ans.push(updatedUser);
            } else {
                ans.push(data[i]);
            }
        }

        await writeFile(PATH, JSON.stringify(ans, null, 2));
        return true;
    } catch (err) {
        console.log(`Error while updating user to the db\n`, err);
        return false;
    }
}


// adding new user
// const newUser = makeUser();
// newUser.lastRoom = "/api/join";
// newUser.userStatus = "banned";
// addUser(newUser);


// updating user's prop
// const userId = "a33704a3-b934-4e7b-b9f0-ac0e45acc718";
// updateUser(userId, { key: "lastRoom", val: "/join/qora-mol" })



module.exports = {
    addUser,
    getUsers,
    updateUser
}
