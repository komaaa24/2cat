
const checkConnection = (io, timeInterval) => {
    setInterval(function () {
        for (let socketID in io.sockets.sockets) {
            io.sockets.sockets[socketID].emit('ping', {});
        }
    }, timeInterval);
}

module.exports = checkConnection;