import React, { useRef } from 'react'
import { useHandler } from './userHandler'
import './SignIn.css'

interface SignInProps {
	backgroundImageUrl: string
	logoUrl: string
}
// SignIn component for Azure B2C custom page layout
const SignIn = (props: SignInProps) => {
	const { backgroundImageUrl, logoUrl } = props
	const apiRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>

	// Initialize handler
	useHandler(apiRef)

	return (
		<div className="signin-page">
			{/* Background Branding */}
			<div id="background_branding_container" data-tenant-branding-background-color="true">
				<img data-tenant-branding-background="true" src={backgroundImageUrl} alt="Background Image" />
			</div>

			{/* Main Auth Container */}
			<div className="auth-container">
				<div className="auth-header">
					<img className="companyLogo" data-tenant-branding-logo="true" src={logoUrl} alt="Company Logo" />
					<h1 className="auth-title">{`Welcome Back`}</h1>
					<p className="auth-subtitle">{`Sign in to your account to continue`}</p>
				</div>

				{/* Azure B2C will inject its authentication controls here */}
				<div id="api" ref={apiRef}></div>
			</div>
		</div>
	)
}

export default SignIn
