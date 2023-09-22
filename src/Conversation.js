import { useState, useEffect } from "react";
import { parse } from "uri-template";
import { useParams } from "react-router-dom";


function Conversation() {
  const [links, setLinks] = useState(null);
  const [user, setUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const { conversationId } = useParams();

  useEffect(() => {

    (async () => {
      const linksResponse = await fetch("http://localhost:8000/", {
        headers: {
          "Authorization": "Bearer 66290d71-7bbe-4c63-98a6-36ba7d843ae4"
        },
        credentials: "include"
      })
      const links = await linksResponse.json();

      try {
        const meResponse = await fetch(links._links["me"].href, {
          headers: {
            "Authorization": "Bearer 66290d71-7bbe-4c63-98a6-36ba7d843ae4"
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
            "Authorization": "Bearer 66290d71-7bbe-4c63-98a6-36ba7d843ae4"
          },
          credentials: "include"
        });

        if (conversationResponse.status === 200) {
          setConversation((await conversationResponse.json()));
        }
      } catch (e) {
      }


      setLinks(links);
    })();

  }, [conversationId]);

  if (conversation) {
    if (conversation._links["start"]) {
      return (
        <div>
          <button onClick={async () => {
            const url = conversation._links["start"].href;
            const startResponse = await fetch(url, {
              method: "POST",
              headers: {
                "Authorization": "Bearer 66290d71-7bbe-4c63-98a6-36ba7d843ae4"
              },
              credentials: "include"
            });

            if (startResponse.status === 200) {
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
        </div>
      );
    }
  }

  return "Loading..."

}

export default Conversation;
