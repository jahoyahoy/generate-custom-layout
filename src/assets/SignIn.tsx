import { useEffect, useRef, useState } from "react";
import "./SignIn.css";

interface IdpHintRedirects {
  [key: string]: string;
}

interface SignInProps {
  domains?: string[];
  idpHintRedirects?: IdpHintRedirects;
  backgroundImageUrl?: string;
  logoUrl?: string;
  title?: string;
  subtitle?: string;
}

const SignIn = (props: SignInProps) => {
  const {
    domains = [],
    idpHintRedirects = {},
    backgroundImageUrl,
    logoUrl,
    title,
    subtitle,
  } = props;

  const [emailVerified, setEmailVerified] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationText, setNotificationText] = useState(
    "You'll be redirected to your organization's sign-in page."
  );
  const [currentSubtitle, setCurrentSubtitle] = useState(subtitle);
  const apiRef = useRef<HTMLDivElement>(null);

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check URL for hint param
  const checkForHint = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hint = urlParams.get("hint");
    if (hint && Object.values(idpHintRedirects).some((idp) => idp === hint)) {
      setShowNotification(true);
    }
  };

  // Handle continue button click
  const handleContinue = () => {
    const emailInput = document.querySelector(
      '#api input[type="email"]'
    ) as HTMLInputElement;

    if (!emailInput) return;

    const email = emailInput.value.toLowerCase().trim();

    if (!validateEmail(email)) {
      showEmailError("Please enter a valid email address");
      return;
    }

    // Clear any previous errors
    clearEmailError();

    // Check for custom IDP domains
    if (domains.some((domain) => email.endsWith(domain))) {
      const domain = domains.find((d) => email.endsWith(d));
      if (domain && idpHintRedirects[domain]) {
        // Redirect to the corresponding IDP
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("hint", idpHintRedirects[domain]);
        window.history.replaceState({}, "", currentUrl.toString());

        // Show notification
        setShowNotification(true);
        setNotificationText(
          "Redirecting to your organization's sign-in page..."
        );

        setTimeout(() => {
          setCurrentSubtitle("Please wait while we redirect you...");
        }, 1000);
      }
    } else {
      // Local account flow
      setEmailVerified(true);
      setCurrentSubtitle("Now enter your password to sign in");

      // Focus on password field when it appears
      setTimeout(() => {
        const passwordInput = document.querySelector(
          '#api input[type="password"]'
        ) as HTMLInputElement;
        if (passwordInput) {
          passwordInput.focus();
        }
      }, 300);
    }
  };

  // Show email validation error
  const showEmailError = (message: string) => {
    clearEmailError();
    const emailInput = document.querySelector(
      '#api input[type="email"]'
    ) as HTMLInputElement;
    if (emailInput) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "field-validation-error";
      errorDiv.textContent = message;
      emailInput.parentNode?.insertBefore(errorDiv, emailInput.nextSibling);
      emailInput.style.borderColor = "#e74c3c";
    }
  };

  // Clear email validation error
  const clearEmailError = () => {
    const existingError = document.querySelector(".field-validation-error");
    if (existingError) {
      existingError.remove();
    }
    const emailInput = document.querySelector(
      '#api input[type="email"]'
    ) as HTMLInputElement;
    if (emailInput) {
      emailInput.style.borderColor = "#e1e5e9";
    }
  };

  // Monitor email input
  const initializeEmailMonitoring = (): boolean => {
    const emailInput = document.querySelector(
      '#api input[type="email"]'
    ) as HTMLInputElement;
    const apiContainer = document.getElementById("api");

    if (!emailInput || !apiContainer) {
      return false;
    }

    // Check if continue button already exists
    if (document.querySelector(".continue-btn")) {
      return true;
    }

    // Create and insert continue button
    const continueBtn = document.createElement("button");
    continueBtn.type = "button";
    continueBtn.className = "continue-btn";
    continueBtn.textContent = "Continue";
    continueBtn.disabled = true;

    // Insert continue button after the email input
    emailInput.parentNode?.insertBefore(continueBtn, emailInput.nextSibling);

    // Handle continue button click
    continueBtn.addEventListener("click", handleContinue);

    // Monitor email input for validation
    emailInput.addEventListener("input", function () {
      const email = this.value.trim();
      const isValid = validateEmail(email);

      continueBtn.disabled = !isValid;

      // Reset state if email is empty or invalid
      if (!email || !isValid) {
        setEmailVerified(false);
        setCurrentSubtitle(subtitle);
        setShowNotification(false);
        clearEmailError();
        return;
      }

      // Reset verified state when changing email
      if (emailVerified && isValid) {
        setEmailVerified(false);
        setCurrentSubtitle(subtitle);
      }

      // Hide notification if not part of any domain
      if (!domains.some((domain) => email.endsWith(domain))) {
        setShowNotification(false);
      }

      clearEmailError();
    });

    // Handle Enter key in email field
    emailInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (!continueBtn.disabled) {
          handleContinue();
        }
      }
    });

    return true;
  };

  // Initialize monitoring with multiple strategies
  const monitorEmailInput = () => {
    const attempts = [500, 1000, 1500, 2000, 3000];
    let attemptIndex = 0;

    const tryInitialize = () => {
      if (initializeEmailMonitoring()) {
        return;
      }

      attemptIndex++;
      if (attemptIndex < attempts.length) {
        setTimeout(tryInitialize, attempts[attemptIndex]);
      }
    };

    tryInitialize();

    // Also try when mutations occur
    if (window.MutationObserver) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
            const emailInput = document.querySelector(
              '#api input[type="email"]'
            );
            if (emailInput && !document.querySelector(".continue-btn")) {
              setTimeout(() => initializeEmailMonitoring(), 500);
            }
          }
        });
      });

      const checkForApi = setInterval(() => {
        const apiContainer = document.getElementById("api");
        if (apiContainer) {
          observer.observe(apiContainer, {
            childList: true,
            subtree: true,
          });
          clearInterval(checkForApi);
        }
      }, 100);
    }
  };

  // Prevent premature form submission
  const preventPrematureSubmission = () => {
    setTimeout(() => {
      const forms = document.querySelectorAll("#api form");
      forms.forEach((form) => {
        form.addEventListener("submit", (e) => {
          if (!emailVerified) {
            e.preventDefault();
            e.stopPropagation();

            const continueBtn = document.querySelector(
              ".continue-btn"
            ) as HTMLButtonElement;
            if (continueBtn && !continueBtn.disabled) {
              handleContinue();
            }
            return false;
          }

          // Add loading state
          const container = document.querySelector(".auth-container");
          container?.classList.add("loading");
        });
      });
    }, 500);
  };

  useEffect(() => {
    checkForHint();
    monitorEmailInput();
    preventPrematureSubmission();

    // Add focus event listeners
    const apiContainer = document.getElementById("api");
    if (apiContainer) {
      const handleFocusIn = (e: Event) => {
        if ((e.target as HTMLElement).matches("input")) {
          apiContainer.classList.add("focused");
        }
      };

      const handleFocusOut = (e: Event) => {
        if ((e.target as HTMLElement).matches("input")) {
          apiContainer.classList.remove("focused");
        }
      };

      apiContainer.addEventListener("focusin", handleFocusIn);
      apiContainer.addEventListener("focusout", handleFocusOut);

      return () => {
        apiContainer.removeEventListener("focusin", handleFocusIn);
        apiContainer.removeEventListener("focusout", handleFocusOut);
      };
    }
  }, []);

  return (
    <div className="signin-page">
      {/* Background Branding */}
      <div
        id="background_branding_container"
        data-tenant-branding-background-color="true"
      >
        <img
          data-tenant-branding-background="true"
          src={backgroundImageUrl}
          alt="Background Image"
        />
      </div>

      <div
        className={`auth-container ${emailVerified ? "email-verified" : ""}`}
      >
        <div className="auth-header">
          <img
            className="companyLogo"
            data-tenant-branding-logo="true"
            src={logoUrl}
            alt="Company Logo"
          />
          <h1 className="auth-title">{title}</h1>
          <p className="auth-subtitle">{currentSubtitle}</p>
        </div>

        {/* Domain notification for custom idp users */}
        <div
          className={`domain-notification ${showNotification ? "show" : ""}`}
        >
          {notificationText}
        </div>

        {/* Azure B2C will inject its authentication controls here */}
        <div id="api" ref={apiRef}></div>
      </div>
    </div>
  );
};

export default SignIn;
