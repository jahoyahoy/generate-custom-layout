import React, { useEffect, useRef } from 'react'
import './SignIn.css'

interface SignInProps {
	backgroundImageUrl?: string
	logoUrl?: string
	title?: string
	subtitle?: string
}

interface DomainConfig {
	domains: string[]
	idpHintRedirects: Record<string, string>
}

const SignIn: React.FC<SignInProps> = ({
	backgroundImageUrl = 'https://aadcdn.msftauthimages.net/81d6b03a-0z-p9pmmygfwyyprzfiznn3q-lxto8zt-krfahm-s1a/logintenantbranding/0/illustration?ts=637975927122325843',
	logoUrl = 'https://aadcdn.msftauthimages.net/81d6b03a-0z-p9pmmygfwyyprzfiznn3q-lxto8zt-krfahm-s1a/logintenantbranding/0/bannerlogo?ts=637943959447343848',
	title = 'Welcome Back',
	subtitle = 'Sign in to your account to continue',
}) => {
	const apiRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		let emailVerified = false

		// Configuration for custom IDP redirects
		const domainConfig: DomainConfig = {
			domains: ['@whtest.com'], // Add more domains as needed
			idpHintRedirects: {
				'@whtest.com': 'whokta',
			},
		}

		// Email validation function
		const validateEmail = (email: string): boolean => {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
			return emailRegex.test(email)
		}

		// Check if email is prefilled and update continue button
		const checkPrefilledEmail = (): void => {
			const emailInput = document.querySelector('#api input[type="email"]') as HTMLInputElement
			const continueBtn = document.querySelector('.continue-btn') as HTMLButtonElement

			if (emailInput && continueBtn) {
				const email = emailInput.value.trim()
				const isValid = validateEmail(email)
				continueBtn.disabled = !isValid
			}
		}

		// Handle continue button click
		const handleContinue = (): void => {
			const emailInput = document.querySelector('#api input[type="email"]') as HTMLInputElement
			const container = document.querySelector('.auth-container')
			const subtitle = document.querySelector('.auth-subtitle')

			if (!emailInput) {
				return
			}

			const email = emailInput.value.toLowerCase().trim()

			if (!validateEmail(email)) {
				showEmailError('Please enter a valid email address')
				return
			}

			// Clear any previous errors
			clearEmailError()

			// Check for custom IDP domains
			if (domainConfig.domains.some((domain) => email.endsWith(domain))) {
				const domain = domainConfig.domains.find((d) => email.endsWith(d))
				if (domain && domainConfig.idpHintRedirects[domain]) {
					// Redirect to custom IDP
					const currentUrl = new URL(window.location.href)
					currentUrl.searchParams.set('domain_hint', domainConfig.idpHintRedirects[domain])
					window.history.replaceState({}, '', currentUrl.toString())
					location.reload() // reload page with appended domain_hint

					if (subtitle) {
						subtitle.textContent = "Redirecting to your organization's sign-in page..."
					}
					return
				}
			}

			// Regular email verification flow
			emailVerified = true
			container?.classList.add('email-verified')

			if (subtitle) {
				subtitle.textContent = 'Now enter your password to sign in'
			}

			// Move forgot password link after password field
			setTimeout(() => {
				const passwordInput = document.querySelector('#api input[type="password"]') as HTMLInputElement
				const forgotPassword = document.getElementById('forgotPassword')

				if (passwordInput && forgotPassword) {
					passwordInput.parentNode?.insertBefore(forgotPassword, passwordInput.nextSibling)
					passwordInput.focus()
				}
			}, 300)
		}

		// Show email validation error
		const showEmailError = (message: string): void => {
			clearEmailError()
			const emailInput = document.querySelector('#api input[type="email"]') as HTMLInputElement
			if (emailInput) {
				const errorDiv = document.createElement('div')
				errorDiv.className = 'field-validation-error'
				errorDiv.textContent = message
				emailInput.parentNode?.insertBefore(errorDiv, emailInput.nextSibling)
				emailInput.style.borderColor = '#e74c3c'
			}
		}

		// Clear email validation error
		const clearEmailError = (): void => {
			const existingError = document.querySelector('.field-validation-error')
			if (existingError) {
				existingError.remove()
			}
			const emailInput = document.querySelector('#api input[type="email"]') as HTMLInputElement
			if (emailInput) {
				emailInput.style.borderColor = '#e1e5e9'
			}
		}

		// Initialize email monitoring
		const initializeEmailMonitoring = (): boolean => {
			const emailInput = document.querySelector('#api input[type="email"]') as HTMLInputElement
			const apiContainer = document.getElementById('api')

			if (!emailInput || !apiContainer) {
				return false
			}

			// Check if continue button already exists
			if (document.querySelector('.continue-btn')) {
				checkPrefilledEmail()
				return true
			}

			// Create and insert continue button
			const continueBtn = document.createElement('button')
			continueBtn.type = 'button'
			continueBtn.className = 'continue-btn'
			continueBtn.textContent = 'Continue'
			continueBtn.disabled = true

			// Insert continue button after the email input
			emailInput.parentNode?.insertBefore(continueBtn, emailInput.nextSibling)

			// Check for prefilled email after button is added
			checkPrefilledEmail()

			// Handle continue button click
			continueBtn.addEventListener('click', handleContinue)

			// Monitor email input for validation
			emailInput.addEventListener('input', function (this: HTMLInputElement) {
				const email = this.value.trim()
				const isValid = validateEmail(email)
				const container = document.querySelector('.auth-container')
				const subtitle = document.querySelector('.auth-subtitle')

				continueBtn.disabled = !isValid

				// Reset state if email is empty or invalid
				if (!email || !isValid) {
					emailVerified = false
					container?.classList.remove('email-verified')

					if (subtitle) {
						subtitle.textContent = 'Sign in to your account to continue'
					}

					clearEmailError()
					return
				}

				// Reset verified state when changing email
				if (emailVerified && isValid) {
					emailVerified = false
					container?.classList.remove('email-verified')

					if (subtitle) {
						subtitle.textContent = 'Sign in to your account to continue'
					}
				}

				clearEmailError()
			})

			// Add listeners for all types of email input changes
			emailInput.addEventListener('change', checkPrefilledEmail)

			emailInput.addEventListener('paste', () => {
				setTimeout(checkPrefilledEmail, 100)
			})

			emailInput.addEventListener('keypress', (e) => {
				if (e.key === 'Enter') {
					e.preventDefault()
					if (!continueBtn.disabled) {
						handleContinue()
					}
				}
			})

			return true
		}

		// Monitor for email input changes
		const monitorEmailInput = (): void => {
			// Try multiple times with increasing delays
			const attempts = [100, 500, 1000, 1500, 2000, 3000]
			let attemptIndex = 0

			const tryInitialize = (): void => {
				if (initializeEmailMonitoring()) {
					return
				}

				attemptIndex++
				if (attemptIndex < attempts.length) {
					setTimeout(tryInitialize, attempts[attemptIndex])
				}
			}

			tryInitialize()

			// Also try when page is fully loaded
			window.addEventListener('load', () => {
				setTimeout(() => {
					if (!document.querySelector('.continue-btn')) {
						initializeEmailMonitoring()
					} else {
						checkPrefilledEmail()
					}
				}, 1000)
			})

			// Watch for B2C API container changes
			if (window.MutationObserver) {
				const observer = new MutationObserver((mutations) => {
					mutations.forEach((mutation) => {
						if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
							const emailInput = document.querySelector('#api input[type="email"]')
							if (emailInput && !document.querySelector('.continue-btn')) {
								setTimeout(() => initializeEmailMonitoring(), 500)
							}
						}
					})
				})

				// Start observing when the API container exists
				const checkForApi = setInterval(() => {
					const apiContainer = document.getElementById('api')
					if (apiContainer) {
						observer.observe(apiContainer, {
							childList: true,
							subtree: true,
						})
						clearInterval(checkForApi)
					}
				}, 100)
			}
		}

		// Prevent form submission until email is verified
		const preventPrematureSubmission = (): void => {
			setTimeout(() => {
				const forms = document.querySelectorAll('#api form')

				forms.forEach((form) => {
					form.addEventListener('submit', (e) => {
						if (!emailVerified) {
							e.preventDefault()
							e.stopPropagation()

							const continueBtn = document.querySelector('.continue-btn') as HTMLButtonElement
							if (continueBtn && !continueBtn.disabled) {
								handleContinue()
							}
							return false
						}

						document.querySelector('.auth-container')?.classList.add('loading')
					})
				})
			}, 500)
		}

		// Initialize all functions
		monitorEmailInput()
		preventPrematureSubmission()

		// Cleanup function
		return () => {
			// Remove event listeners if needed
		}
	}, [])

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
					<h1 className="auth-title">{title}</h1>
					<p className="auth-subtitle">{subtitle}</p>
				</div>

				{/* Azure B2C will inject its authentication controls here */}
				<div id="api" ref={apiRef}></div>
			</div>
		</div>
	)
}

export default SignIn
