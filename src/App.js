import { useState } from "react";

function App() {
  const [email, setEmail] = useState("parent@example.com");
  const [childName, setChildName] = useState("Johnny");

  return (
    <div>
      <form onSubmit={async (e) => {
        e.preventDefault();

        const indexResponse = await fetch("http://localhost:8000/", {
          method: "GET",
          headers: {
            "Authorization": "Bearer 66290d71-7bbe-4c63-98a6-36ba7d843ae4"
          },
          credentials: "include"
        })
        const indexResponseJson = await indexResponse.json();

        const loginResponse = await fetch(indexResponseJson._links["session:create"].href, {
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
        const loginResponseJson = await loginResponse.json();

        console.log(loginResponseJson);
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
  );
}

export default App;
