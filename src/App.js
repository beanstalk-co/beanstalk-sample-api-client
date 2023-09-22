import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function App() {
  const [email, setEmail] = useState("parent@example.com");
  const [childName, setChildName] = useState("Johnny");
  const [links, setLinks] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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
      setLinks(links);
    })();

  }, []);

  if (user) {
    return (
      <div>
        Welcome {JSON.stringify(user)}

        <div>
          <button onClick={async () => {
            const conversationResponse = await fetch(user._links["conversations:create"].href, {
              method: "POST",
              headers: {
                "Authorization": "Bearer 66290d71-7bbe-4c63-98a6-36ba7d843ae4",
                "Content-Type": "application/json"
              },
              body: JSON.stringify({}),
              credentials: "include"
            });

            if (conversationResponse.status === 201) {
              const conversation = await conversationResponse.json();
              navigate(`/conversations/${conversation.id}`);
            }

          }}>Create Conversation</button>
        </div>

      </div>
    );
  }

  if (links) {
    return <div>
      <form onSubmit={async (e) => {
        e.preventDefault();
        console.log(links);

        const loginResponse = await fetch(links._links["login"].href, {
          method: "POST",
          headers: {
            "Authorization": "Bearer 66290d71-7bbe-4c63-98a6-36ba7d843ae4",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            childName
          }),
          credentials: "include"
        });

        if (loginResponse.status === 201) {
          const loginResponseJson = await loginResponse.json();
          setUser(loginResponseJson);
        }

      }}>
        <div>
          <label>Email</label>
          <input type="text"
            placeholder="Enter Parent's Email"
            value={email}
            onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label>Child Name</label>
          <input type="text"
            placeholder="Enter Child Name"
            value={childName}
            onChange={e => setChildName(e.target.value)} />
        </div>
        <div><button>Login</button></div>
      </form>
    </div>
  }

  return "Loading..."

}

export default App;
