/**
 * Creates many connections based on the amount passed as parameter.
 * 
 * @param {function} connect The method to create a new connection
 * @param {number} amountOfConnections The ammount of connectionst to create
 * @returns 
 */
const getConnections = async (connect, amountOfConnections) => {
  let connections = [];
  for (let i = 0; i < amountOfConnections; i++) {
    try {
      const connection = await connect();
      connections.push(connection);
    } catch (error) {}
  }
  return connections
}

/**
 * Returns which is the index of the next connection to be used.
 * 
 * @param {number} index Index of the last connection used
 * @param {number} connectionsLength The amount of connections available
 * @returns 
 */
const getNextConnectionIndex = (index, connectionsLength) => {
  index++;
  if (index >= connectionsLength) {
    index = 0;
  }
  return index;
}

/**
 * Downloads a list of files in parallel.
 * 
 * @param {Array} downloadList List of items to download
 * @param {Array} connections List of open connections
 * @param {function} save Function to save the result of the download
 */
const downloadAllFiles = async (downloadList, connections, save) => {
  let downloads = [];
  let nextConnectionIndex = 0;
  for (const downloadItem of downloadList) {
    downloads.push(downloadFile(downloadItem, connections[nextConnectionIndex].download, save))
    nextConnectionIndex = getNextConnectionIndex(nextConnectionIndex, connections.length)
  }
  await Promise.all(downloads)
}

/**
 * Downloads a specific file.
 * 
 * @param {string} downloadItem Item to be downloaded
 * @param {function} download Function to download a specific file
 * @param {function} save Function to save the result of the download
 */
const downloadFile = async (downloadItem, download, save) => {
  const result = await download(downloadItem)
  save(result)
}

/**
 * Closes all open connections.
 * 
 * @param {Array} connections List of connections to be closed
 */
const closeAllConnections = (connections) => {
  for (const connection of connections) {
    if (connection.hasOwnProperty('close')) connection.close()
  }
}

const pooledDownload = async (connect, save, downloadList, maxConcurrency) => {
  const amountOfConnections = downloadList.length < maxConcurrency ? downloadList.length : maxConcurrency;
  let connections;

  try {
    connections = await getConnections(connect, amountOfConnections);
  } catch (error) { }

  if (!connections || connections.length === 0) {
    throw new Error("connection failed")
  }

  try {
    await downloadAllFiles(downloadList, connections, save)
  } catch (error) {
    closeAllConnections(connections)
    throw new Error("unexpected error during download")
  }

  closeAllConnections(connections)

  return;
}

module.exports = pooledDownload
