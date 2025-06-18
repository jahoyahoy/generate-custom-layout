//import "./App.css";
import SignIn from "./assets/SignIn";

function App() {
  return (
    <>
      <SignIn
        domains={["@ahoyahoy.com", "@test.com"]}
        idpHintRedirects={{
          "@ahoyahoy.com": "whokta",
          "@test.com": "testIdP",
        }}
        backgroundImageUrl="https://aadcdn.msftauthimages.net/81d6b03a-0z-p9pmmygfwyyprzfiznn3q-lxto8zt-krfahm-s1a/logintenantbranding/0/illustration?ts=637975927122325843"
        logoUrl="https://aadcdn.msftauthimages.net/81d6b03a-0z-p9pmmygfwyyprzfiznn3q-lxto8zt-krfahm-s1a/logintenantbranding/0/bannerlogo?ts=637943959447343848"
        title="Welcome Back"
        subtitle="Sign in to your account to continue"
      />
    </>
  );
}

export default App;
