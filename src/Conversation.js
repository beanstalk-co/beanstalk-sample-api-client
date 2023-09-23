import { useState, useEffect } from "react";
import { parse } from "uri-template";
import { useParams } from "react-router-dom";

let audioContext;
let bufferQueue = [];
let isPlaying = false;

function Conversation() {
  const [links, setLinks] = useState(null);
  const [message, setMessage] = useState("");
  const [messageEnabled, setMessageEnabled] = useState(false);
  const [started, setStarted] = useState(false);
  const [user, setUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const { conversationId } = useParams();

  useEffect(() => {

    (async () => {
      const linksResponse = await fetch(process.env.REACT_APP_API_URL, {
        headers: {
          "Authorization": `Bearer ${process.env.REACT_APP_API_KEY}`
        },
        credentials: "include"
      })
      const links = await linksResponse.json();

      try {
        const meResponse = await fetch(links._links["me"].href, {
          headers: {
            "Authorization": `Bearer ${process.env.REACT_APP_API_KEY}`
          },
          credentials: "include"
        });

        if (meResponse.status === 200) {
          setUser((await meResponse.json()));
        }
      } catch (e) {
      }

      const template = parse(links._links["conversation"].href);
      const url = template.expand({ conversationId });
      try {
        const conversationResponse = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${process.env.REACT_APP_API_KEY}`
          },
          credentials: "include"
        });

        if (conversationResponse.status === 200) {
          const conversation = await conversationResponse.json();
          setConversation(conversation);
        }
      } catch (e) {
      }


      setLinks(links);
    })();

  }, [conversationId]);

  if (conversation) {
    if (!started) {
      return (
        <div>
          <button onClick={async () => {
            audioContext = audioContext || new AudioContext();
            setStarted(true);

            const url = conversation._links["start"].href;
            const startResponse = await fetch(url, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${process.env.REACT_APP_API_KEY}`
              },
              credentials: "include"
            });

            if (startResponse.status === 200) {
              await parseMultipartResponse(
                startResponse,
                (jsonData) => {
                  setConversation(JSON.parse(jsonData));
                },
                () => { 
                  setMessageEnabled(true);
                }
              );
              console.log("started");
            }
          }}>
            Start
          </button>
        </div>
      );
    } else {
      return (
        <div>
          Conversation!

          <form onSubmit={async e => {
            e.preventDefault();
            setMessageEnabled(false);

            const url = conversation._links["messages:create"].href;
            const messageResponse = await fetch(url, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${process.env.REACT_APP_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                message
              }),
              credentials: "include"
            });

            if (messageResponse.status === 200) {
              await parseMultipartResponse(
                messageResponse,
                () => {},
                () => {
                  setMessageEnabled(true);
                }
              );
              console.log("started");
              setMessage("");
            }
          }}>

            <div>
              <textarea value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type your message here"
                disabled={!messageEnabled}
                ></textarea>
            </div>
            <div>
              <button type="submit" disabled={!messageEnabled}>Send</button>
            </div>

          </form>
        </div>
      );
    }
  }

  return "Loading..."

}

function indexOf(array, search) {
  const searchArray = new TextEncoder().encode(search);
  let foundIndex = -1;
  array.some((_, i) => array.slice(i, i + searchArray.length).every((val, j) => val === searchArray[j]) ? ((foundIndex = i), true) : false);
  return foundIndex;
};


async function parseMultipartResponse(response, jsonCallback, onComplete) {
  const reader = response.body.getReader();
  let boundary = getBoundary(response.headers.get('Content-Type'));
  let buffer = new Uint8Array();

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      processChunk(buffer, jsonCallback, onComplete);
      break;
    }

    let tmp = new Uint8Array(buffer.length + value.length);
    tmp.set(buffer, 0);
    tmp.set(value, buffer.length);
    buffer = tmp;
    let boundaryIndex = indexOf(buffer, boundary);

    while (boundaryIndex !== -1) {
      let chunk = buffer.slice(0, boundaryIndex);
      processChunk(chunk, jsonCallback, onComplete);
      buffer = buffer.slice(boundaryIndex + boundary.length);
      boundaryIndex = indexOf(buffer, boundary);
    }
  }
}

function processChunk(chunk, jsonCallback, onComplete) {
  const separatorIndex = indexOf(chunk, "\r\n\r\n");

  if (separatorIndex !== -1) {
    const headersString = new TextDecoder().decode(chunk.slice(0, separatorIndex));
    const headersArray = headersString.split('\r\n');
    const headers = headersArray.reduce((acc, headerLine) => {
      const [key, value] = headerLine.split(': ');
      acc[key] = value;
      return acc;
    }, {});

    console.log('Content-Type of the chunk:', headers['Content-Type']);

    const body = chunk.slice(separatorIndex + "\r\n\r\n".length);

    if (body.length > 0) {
      switch (headers['Content-Type']) {
        case 'application/json':
          const jsonString = new TextDecoder().decode(body);
          const jsonData = jsonString.slice(0, -2);
          jsonCallback(jsonData);
          break;

        case 'audio/mpeg':
          const audioArrayBuffer = body.buffer;
          audioContext.decodeAudioData(audioArrayBuffer, (decodedData) => {
            bufferQueue.push(decodedData);
            if (!isPlaying) {
              playAudioBuffer(onComplete);
            }
          });
          break;
      }
    }
  }
}

function getBoundary(contentType) {
  // Parse the boundary from the Content-Type header
  return contentType.split(';')[1].split('=')[1];
}

async function playAudioBuffer(onComplete) {
  if (isPlaying || bufferQueue.length === 0) {
    console.log("done playing")
    onComplete();
    return
  };
  console.log("playing")
  isPlaying = true;

  const currentBuffer = bufferQueue.shift();
  const source = audioContext.createBufferSource();
  source.buffer = currentBuffer;
  source.connect(audioContext.destination);
  source.onended = () => {
    isPlaying = false;
    playAudioBuffer(onComplete);
  };
  source.start();
}

export default Conversation;
