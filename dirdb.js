const bcrypt = require('bcrypt');
const path = require('path');
const fs = require("fs");
const crypto = require('crypto');

if (fs.existsSync("/tmp/myfile")) {
  console.log("/tmp/myfile exists!");
} else {
  console.log("/tmp/myfile does not exist!");
}


const tracksDir = path.join(__dirname, 'trackings');

async function hashString(text, salt) {
    return crypto.createHash('sha256').update(text + salt).digest('hex');
}

async function getTrackingFileName(id)
{
    return await hashString(id.toString(), "idsalty");
}

async function getUserDir(username)
{
    const dirName = await hashString(username, "salty");
    const fullPath = path.join(tracksDir, dirName);
    return fullPath;
}

async function getUserEncryptedMasterKey(username)
{
    const userDir = await getUserDir(username);
    const file = path.join(userDir, "master_key.enc");
    return fs.readFileSync(file);
}

async function dirExists(username)
{
    const fullPath = await getUserDir(username);
    return ioDirectoryExists(fullPath);
}

async function createDir(username, encckey)
{
    const fullPath = await getUserDir(username);
    if (!ioDirectoryExists(fullPath))
    {
        ioCreateDirectory(fullPath);
        createKey(fullPath, encckey);
    }
}

function ioDirectoryExists(path)
{
    if (fs.existsSync(path))
    {
        return true;
    }
    else
    {
        return false;
    }
}

function ioCreateDirectory(path)
{
    fs.mkdirSync(path);
}

function ioSaveFile(filePath, data) {
  fs.writeFile(
    filePath,
    data,
    { encoding: 'utf8' },
    (err) => {
      if (err) {
        console.error(`Error writing file ${filePath}:`, err);
      } else {
        console.log(`File ${filePath} written successfully!`);
      }
    }
  );
}

function ioReadFileSync(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    console.log(`File ${filePath} read successfully!`);
    return data;
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    // Rethrow or return something else based on your error-handling strategy
    throw err;
  }
}

function ioRemoveFileSync(filePath) {
  try {
    fs.unlinkSync(filePath, () =>{});
    console.log(`${filePath} removed`);
  }
  catch (err) {
    console.error(`Error removing file ${filePath}:`, err);
    throw err;
  }
}

function ioGetAllJsonFilesFromDirectory(dir) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) {
        return reject(err);
      }
      const jsonFiles = files.filter(file => path.extname(file) === '.json');
      resolve(jsonFiles);
    });
  });
}


async function setRandomKey(encckey) {
    // 1. Generate a random "master key" (32 bytes for AES-256)
    const masterKey = crypto.randomBytes(32);
    
    // 2. Create a random salt for PBKDF2
    const salt = crypto.randomBytes(16);
    
    // 3. Derive a 256-bit key from the user's password + salt
    const derivedKey = await new Promise((resolve, reject) => {
      crypto.pbkdf2(encckey, salt, 100000, 32, 'sha256', (err, derived) => {
        if (err) return reject(err);
        resolve(derived);
      });
    });
  
    // 4. Generate a random IV (12 bytes for AES-GCM)
    const iv = crypto.randomBytes(12);
  
    // 5. Encrypt the masterKey with the derivedKey
    const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
    const encrypted = Buffer.concat([cipher.update(masterKey), cipher.final()]);
    const authTag = cipher.getAuthTag();
  
    // 6. Return all data needed to decrypt later
    return {
      salt: salt.toString('hex'),         // store so you can re-derive the key
      iv: iv.toString('hex'),            // needed for decryption
      authTag: authTag.toString('hex'),  // GCM authentication tag
      ciphertext: encrypted.toString('hex') // the encrypted master key
    };
  }
  

  async function createKey(fullpath, password) {
    // 1. Generate the encrypted master key
    const encryptedMasterKey = await setRandomKey(password);
  
    // 2. Convert it to a JSON string
    const jsonData = JSON.stringify(encryptedMasterKey, null, 2);
    console.log(encryptedMasterKey);
    console.log(jsonData);
  
    // 3. Write to a file (e.g., 'master_key.enc')
    const filePath = path.join(fullpath, 'master_key.enc');
    fs.writeFileSync(filePath, jsonData, 'utf8');
  
    console.log(`Master key encrypted data stored at: ${filePath}`);
  }

  async function attemptDecryptMasterKey(username, password) {
    try {
      const encryptedData = await getUserEncryptedMasterKey(username);
      const { salt, iv, authTag, ciphertext } =  JSON.parse(encryptedData.toString());
  
      // 1. Convert hex fields back to Buffers
      const saltBuf = Buffer.from(salt, 'hex');
      const ivBuf = Buffer.from(iv, 'hex');
      const authTagBuf = Buffer.from(authTag, 'hex');
      const cipherBuf = Buffer.from(ciphertext, 'hex');
  
      // 2. Derive the AES-256 key using PBKDF2
      const derivedKey = await new Promise((resolve, reject) => {
        crypto.pbkdf2(password, saltBuf, 100000, 32, 'sha256', (err, key) => {
          if (err) return reject(err);
          resolve(key);
        });
      });
  
      // 3. Decrypt using AES-256-GCM
      const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, ivBuf);
      decipher.setAuthTag(authTagBuf);
  
      const decrypted = Buffer.concat([
        decipher.update(cipherBuf),
        decipher.final(),
      ]);
  
      // If it gets here without throwing, decryption was successful
      return decrypted; // This should be your 32-byte master key
    } catch (error) {
      // If there's any error (wrong password, bad auth tag, etc.), return null
      return null;
    }
  }

  async function encryptUserFileWithId(username, id, data, masterKey)
  {
    const userDir = await getUserDir(username);
    const trackingFileId = await getTrackingFileName(id);
    const filePath = path.join(userDir, `${trackingFileId}.json`);
    console.log(filePath);
    await encryptAndSaveFile(filePath, data, masterKey);
  }

  async function encryptAndSaveFile(filePath, data, masterKey) {
    try {
        console.log(filePath);
      // Convert `data` to a Buffer if it's a string
      const plaintextBuf = (typeof data === 'string')
        ? Buffer.from(data, 'utf-8')
        : Buffer.from(data);
        console.log(filePath);
      // 1. Generate a random IV (12 bytes is typical for GCM)
      const iv = crypto.randomBytes(12);
  
      // 2. Create the cipher
      const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
      console.log(filePath);
      // 3. Encrypt
      const ciphertext = Buffer.concat([
        cipher.update(plaintextBuf),
        cipher.final()
      ]);
      console.log(filePath);
      // 4. Get the authentication tag
      const authTag = cipher.getAuthTag();
  
      // 5. Build an object containing all necessary fields
      const encryptedData = {
        iv: iv.toString('hex'),            // store IV as hex
        authTag: authTag.toString('hex'), // GCM auth tag as hex
        ciphertext: ciphertext.toString('hex')
      };
  
      console.log(filePath);
      console.log(JSON.stringify(encryptedData, null, 2));
      // 6. Convert to JSON and save to file
      ioSaveFile(filePath, JSON.stringify(encryptedData, null, 2));
    } catch (err) {
      console.error('Error in encryptAndSaveFile:', err);
      throw err;
    }
  }

  async function decryptAllUserFiles(username, masterKey) {
    const userDir = await getUserDir(username);
    console.log(userDir);
    const jsonFiles = await ioGetAllJsonFilesFromDirectory(userDir);
    const combinedData = [];
    if (jsonFiles.length > 0)
    {
      for (let i = 0 ; i < jsonFiles.length ; i++)
      {
        const filePath = path.join(userDir, jsonFiles[i]);
        const decrypted = await decryptFile(filePath, masterKey);
        console.log(JSON.parse(decrypted));
        combinedData.push(JSON.parse(decrypted));
      }
    }
    return combinedData;
  }
  
  async function decryptFile(filePath, masterKey) {
    const fileContent = ioReadFileSync(filePath);
    const { iv, authTag, ciphertext } = JSON.parse(fileContent);
  
    // Convert fields back to buffers
    const ivBuf = Buffer.from(iv, 'hex');
    const authTagBuf = Buffer.from(authTag, 'hex');
    const cipherBuf = Buffer.from(ciphertext, 'hex');
  
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, ivBuf);
    decipher.setAuthTag(authTagBuf);
  
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(cipherBuf),
      decipher.final(),
    ]);
  
    return decrypted; // Buffer
  }


async function removeUserTrackingAtId(user, id) {
  const userDir = await getUserDir(user);
  const trackingName = await getTrackingFileName(id);
  const filePath = path.join(userDir, `${trackingName}.json`);
  ioRemoveFileSync(filePath);
}
  


module.exports = {
    dirExists,
    createDir,
    attemptDecryptMasterKey,
    encryptUserFileWithId,
    decryptAllUserFiles,
    removeUserTrackingAtId
};