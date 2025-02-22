const http = require('http');
const fs = require('fs');
const path = require('path');

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { createTables } = require('./db/db');
const { insertUser } = require('./db/db');
const { getUserId } = require('./db/db');
const dirdb = require('./dirdb');

// Define the base directories
const baseDir = path.join(__dirname, 'www');
const trackingsDir = path.join(baseDir, 'trackings');
const idToFileMap = createIdToFileNameMap();

createTables();

// Create the HTTP server
http.createServer((req, res) => {
  if (req.method === 'GET')
  {
    if (req.url.startsWith('/api/trackings'))
    {
      const trackingName = req.url.split('/api/trackings/')[1]; // Extract the file name (if any)

      if (!trackingName || trackingName === '') {
        // Combine all JSON files in the trackings directory
        fs.readdir(trackingsDir, (err, files) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }

          const jsonFiles = files.filter(file => path.extname(file) === '.json'); // Only JSON files
          const combinedData = [];

          let filesRead = 0;
          if (jsonFiles.length === 0) {
            // No JSON files to read
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({trackings: combinedData}));
            return;
          }

          // Read each JSON file and merge the content
          jsonFiles.forEach(file => {
            const filePath = path.join(trackingsDir, file);
            fs.readFile(filePath, 'utf8', (readErr, data) => {
              filesRead++;
              if (!readErr) {
                try {
                  const jsonData = JSON.parse(data);
                  combinedData.push(jsonData);
                } catch (parseErr) {
                  console.error(`Error parsing JSON from ${file}:`, parseErr);
                }
              }

              // Once all files are processed, return the combined data
              if (filesRead === jsonFiles.length) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(combinedData));
              }
            });
          });
        });
      } 
      else 
      {
        // Serve a specific tracking JSON file
        const filePath = path.join(trackingsDir, `${trackingName}.json`);
        fs.readFile(filePath, (err, data) => {
          if (err) 
          {
            if (err.code === 'ENOENT') 
            {
              // File not found
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'File not found' }));
            } 
            else 
            {
              // Other server error
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Internal server error' }));
            }
          } 
          else
          {
            // File found, serve it
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
          }
        });
      }
    } 
    else if (req.url === '/') 
    {
      // Serve index.html for the root URL
      const filePath = path.join(baseDir, 'index.html');
      fs.readFile(filePath, (err, data) => {
        if (err)
        {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('500 Internal Server Error');
        } 
        else 
        {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        }
      });
    } 
    else
    {
      // Serve static files
      const filePath = path.join(baseDir, req.url);
      const extname = path.extname(filePath);
      const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
      }[extname] || 'application/octet-stream';

      fs.readFile(filePath, (err, data) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Internal Server Error');
          }
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(data);
        }
      });
    }
  } 
  else if (req.method === 'POST') 
  {
    if (req.url.startsWith('/eregister'))
    {
      let body = '';

    // Collect the data from the request body
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        // Parse the JSON payload
        const { email, password } = JSON.parse(body);

        if (!email || !password) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Email and password are required' }));
          return;
        }

        const userExists = await dirdb.dirExists(email);

        if (userExists)
        {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'This email address is already registered' }));
          return;
        }
        else
        {
          await dirdb.createDir(email, password);
          res.end(JSON.stringify({ error: 'Email registered.' }));
          return;
        }

      

      } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'An error occurred while registering the user' }));
        console.error('Error during user registration:', error);
      }
    });
    }
    else if (req.url.startsWith('/elogin'))
    {
      let body = '';

    // Collect the data from the request body
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        // Parse the JSON payload
        const { email, password } = JSON.parse(body);

        if (!email || !password) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Email and password are required' }));
          return;
        }
        
        const userExists = await dirdb.dirExists(email);

        if (userExists)
        {
          if (!hasActiveSession(email))
          {
            const masterKey = await dirdb.attemptDecryptMasterKey(email, password);
            if (masterKey != null)
            {
              const sessionID = createSession(email, masterKey);
              const expiration = new Date(Date.now() + 30 * 60 * 1000).toUTCString(); 
              res.setHeader('Set-Cookie', `sessionID=${sessionID}; Expires=${expiration}; HttpOnly; Path=/; Secure; SameSite=Strict`);
              res.end(JSON.stringify({ error: '', token: sessionID, expiration: new Date(expiration).toISOString()  }));
              return;
            }
            else
            {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Username or password is wrong' }));
              return;
            }
          }
          else {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'User session already exists.' }));
            return;
          }
        }
        else
        {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Username or password is wrong' }));
          return;
        }

      

      } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'An error occurred while registering the user' }));
        console.error('Error during user registration:', error);
      }
    });
    }
    else if (req.url.startsWith('/elogout')) {
      let body = '';

    // Collect the data from the request body
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const jsonData = JSON.parse(body);
        const session = sessions.get(jsonData.token);
        console.log(session);
        console.log(jsonData.token);
        if (session) {
          sessions.delete(jsonData.token);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'USer successfully logged out' }));
        }
        else
        {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid session token' }));
          return;
        }
      }
      catch (err) {
        
      }
    });
    }
    else if (req.url.startsWith('/api/trackings/eupdate/'))
    {
        const trackingId = req.url.split('/api/trackings/eupdate/')[1];
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
  
        req.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                const session = sessions.get(jsonData.token);
                console.log(session);
                console.log(jsonData.token);
                if (session)
                {
                  const user = session.userID;
                  console.log(user);
                  dirdb.encryptUserFileWithId(user, trackingId, jsonData.tracking.toString(), session.masterKey);
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ message: 'Tracking updated successfully' }));
                }
                else
                {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Invalid session token' }));
                  return;
                }

                // updateJsonFile(filePath, data.toString());
                // res.writeHead(200, { 'Content-Type': 'application/json' });
                // res.end(JSON.stringify({ message: 'Tracking updated successfully', fileName: filePath }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON data' }));
                console.log(err.toString());
            }
        });
    }
    else if (req.url.startsWith('/api/etrackings'))
    {
        let body = '';
  
        // Collect the data from the request body
        req.on('data', chunk => {
          body += chunk;
        });
    
        req.on('end', async () => {
          try {
            // Parse the JSON payload
            console.log(body);
            console.log(req.cookies);
            const jsonData = JSON.parse(body);
            const session = sessions.get(jsonData.token);
  
            if (session)
            {
              const combinedData = await dirdb.decryptAllUserFiles(session.userID, session.masterKey);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({trackings: combinedData, userID: session.userID}));
            }
            else
            {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid session token' }));
              return;
            }
    
          
    
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'An error occurred while registering the user' }));
            console.error('Error during user registration:', error);
          }
        });
    }
    else if (req.url.startsWith('/api/trackings/eremove'))
    {
      let body = '';
  
      // Collect the data from the request body
      req.on('data', chunk => {
        body += chunk;
      });
  
      req.on('end', async () => {
        try {
          // Parse the JSON payload
          console.log(body);
          const jsonData = JSON.parse(body);
          const session = sessions.get(jsonData.token);
          if (session)
          {
            await dirdb.removeUserTrackingAtId(session.userID, jsonData.id);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({error: ''}));
          }
          else
          {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid session token' }));
            return;
          }
        } catch (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'An error occurred while removing the tracking' }));
          console.error('Error during removing the tracking:', error);
        }
      });
    }
    else
    {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('405 POST method Not Allowed');
    }
  } 
  else {
    // Handle unsupported HTTP methods
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('405 Method Not Allowed');
  }
}).listen(80, () => {
  console.log('HTTP Server is running on http://localhost:80');
});

function updateJsonFile(filePath, jsonData) {
  fs.writeFileSync(filePath, jsonData, 'utf8');
}

function extractAttributeFromJson(jsonString, attribute) {
  try {
      const jsonObj = JSON.parse(jsonString);
      return jsonObj[attribute];
  } catch (error) {
      console.error('Invalid JSON string', error);
      return null;
  }
}

function replaceLocalLetters(input) {
  const localCharsMap = {
      'ą': 'a', 'Ą': 'A',
      'ć': 'c', 'Ć': 'C',
      'ę': 'e', 'Ę': 'E',
      'ł': 'l', 'Ł': 'L',
      'ń': 'n', 'Ń': 'N',
      'ó': 'o', 'Ó': 'O',
      'ś': 's', 'Ś': 'S',
      'ź': 'z', 'Ź': 'Z',
      'ż': 'z', 'Ż': 'Z',
      'ü': 'u', 'Ü': 'U',
      'ß': 'ss', // for German 'sharp S'
      // Add any other local characters here
  };

  // Replace local characters with their mapped values
  return input.replace(/[ąćęłńóśźżüßĄĆĘŁŃÓŚŹŻÜ]/g, match => localCharsMap[match] || match);
}

// Simple in-memory session store
const sessions = new Map(); // sessionID -> { userID, masterKey, createdAt, ... }

// Utility to generate a random session token
function generateSessionID() {
  return crypto.randomBytes(16).toString('hex');
}

function hasActiveSession(userID) {
  for (const session of sessions.values()) {
    if (session.userID === userID) {
      return true;
    }
  }
  return false;
}

// Create a session and store the user’s masterKey
function createSession(userID, masterKey) {
  const sessionID = generateSessionID();
  sessions.set(sessionID, {
    userID,
    masterKey,
    createdAt: Date.now()
  });
  return sessionID;
}

function createIdToFileNameMap() {
  const idToFileMap = new Map();
  const files = fs.readdirSync(trackingsDir);
  files.forEach(file => {
      const filePath = path.join(trackingsDir, file);
      if (path.extname(file) === '.json') {
          try {
              const fileContent = fs.readFileSync(filePath, 'utf8');
              const jsonData = JSON.parse(fileContent);
              if (jsonData.id) {
                  idToFileMap.set(jsonData.id.toString(), filePath);
              } else {
                  console.warn(`File ${file} does not have an 'id' property.`);
              }
          } catch (err) {
              console.error(`Error reading or parsing ${file}:`, err);
          }
      }
  });

  for (const [key, value] of idToFileMap) {
    console.log(`Key: ${key}, Value: ${value}`);
  }
  return idToFileMap;
}

// Helper to fetch session info
function getSession(sessionID) {
  return sessions.get(sessionID) || null;
}
