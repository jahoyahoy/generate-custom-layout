import { useEffect } from 'react'
import { idpRedirects } from './types'

// Custom hook to handle email input and continue button logic
// This hook monitors the email input field, validates the email format
// and manages the continue button state for Azure B2C authentication flows.

// The continue button by default doesn't exist, so we had to create some hacky logic to insert it
// into Azures B2C authentication flow. This is because Azure B2C doesn't allow us to modify the their flow directly.

export const useHandler = (apiRef: React.RefObject<HTMLDivElement>) => {
	useEffect(() => {
		let emailVerified = false

		// Helper function to get API container
		const getApiContainer = (): HTMLElement | null => {
			return apiRef.current || document.getElementById('api')
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
			if (Object.keys(idpRedirects).some((domain) => email.endsWith(domain))) {
				const domain = Object.keys(idpRedirects).find((domain) => email.endsWith(domain))
				if (domain && idpRedirects[domain]) {
					// Redirect to custom IDP
					const currentUrl = new URL(window.location.href)
					currentUrl.searchParams.set('domain_hint', idpRedirects[domain])
					window.history.replaceState({}, '', currentUrl.toString())
					location.reload() // reload page with appended domain_hint
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
			const apiContainer = getApiContainer()
			const emailInput = apiContainer?.querySelector('input[type="email"]') as HTMLInputElement

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
				const apiContainer = getApiContainer()
				const forms = apiContainer?.querySelectorAll('form') || []

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

		// cleanup - can probably add remove for event listeners.
		return () => {}
	}, [])
}
