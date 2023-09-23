import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function App() {
  const [email, setEmail] = useState("parent@example.com");
  const [childName, setChildName] = useState("Johnny");
  const [links, setLinks] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [characters, setCharacters] = useState(null);

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
      setLinks(links);
    })();

  }, []);

  useEffect(() => {
    if (links) {
      (async () => {
        const charactersResponse = await fetch(links._links["characters"].href, {
          headers: {
            "Authorization": `Bearer ${process.env.REACT_APP_API_KEY}`
          },
          credentials: "include"
        })
        const characters = await charactersResponse.json();

        setCharacters(characters);
      })();
    }

  }, [links, user]);

  if (user) {
    return (
      <div>
        <h1>
          Welcome {user.childName}!
        </h1>

        {
          characters && <div>
            <h2>Choose a Character</h2>
            {
              characters.map(
                character => {
                  return <div key={character.url_slug}>
                    <h3>{character.name}</h3>
                    <img src={character.thumbnail_url} alt={character.name} style={{maxWidth: "200px"}} />
                    <ul>
                      {character.scenes.map(scene => {
                        return <li key={scene.url_slug}>
                          <a href="#" onClick={async e => {
                            e.preventDefault();

                            const conversationResponse = await fetch(user._links["conversations:create"].href, {
                              method: "POST",
                              headers: {
                                "Authorization": `Bearer ${process.env.REACT_APP_API_KEY}`,
                                "Content-Type": "application/json"
                              },
                              body: JSON.stringify({
                                character: character.url_slug,
                                scene: scene.url_slug
                              }),
                              credentials: "include"
                            });

                            if (conversationResponse.status === 201) {
                              const conversation = await conversationResponse.json();
                              navigate(`/conversations/${conversation.id}`);
                            }
                          }}>
                            {scene.name}
                          </a>
                        </li>
                      })
                      }
                    </ul>
                  </div>
                }
              )
            }


          </div>
        }

      </div >
    );
  }

  if (links) {
    return <div>
      <form onSubmit={async (e) => {
        e.preventDefault();

        const loginResponse = await fetch(links._links["login"].href, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.REACT_APP_API_KEY}`,
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
