//import "./App.css";
import SignIn from './assets/SignIn'

const backgroundImageUrl =
	'https://aadcdn.msftauthimages.net/81d6b03a-0z-p9pmmygfwyyprzfiznn3q-lxto8zt-krfahm-s1a/logintenantbranding/0/illustration?ts=637975927122325843'
const logoUrl = 'https://aadcdn.msftauthimages.net/81d6b03a-0z-p9pmmygfwyyprzfiznn3q-lxto8zt-krfahm-s1a/logintenantbranding/0/bannerlogo?ts=637943959447343848'

function App() {
	return (
		<>
			<SignIn backgroundImageUrl={backgroundImageUrl} logoUrl={logoUrl} />
		</>
	)
}

export default App
