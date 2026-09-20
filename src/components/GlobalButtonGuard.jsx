import { useEffect } from 'react';

const LOCK_ATTRIBUTE = 'data-global-click-locked';
const NO_LOCK_ATTRIBUTE = 'data-no-global-click-lock';

export default function GlobalButtonGuard() {
  useEffect(() => {
    const lockedButtons = new Set();
    let activeRequests = 0;

    const unlockButton = (button) => {
      if (!button) return;
      button.removeAttribute(LOCK_ATTRIBUTE);
      button.removeAttribute('aria-disabled');
      button.removeAttribute('aria-busy');
      button.classList.remove('global-button-locked');
      button.disabled = false;
      lockedButtons.delete(button);
    };

    const unlockAll = () => {
      lockedButtons.forEach(unlockButton);
    };

    const handleRequestStart = () => {
      activeRequests += 1;
    };

    const handleRequestEnd = () => {
      activeRequests = Math.max(0, activeRequests - 1);
      if (activeRequests === 0) {
        unlockAll();
      }
    };

    const handleClick = (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      const button = target?.closest?.('button, [role="button"]');
      if (!button) return;

      // Some controls are pure UI toggles (for example the mobile hamburger menu).
      // They must stay instant and should never be blocked by API request protection.
      if (button.closest(`[${NO_LOCK_ATTRIBUTE}="true"]`)) return;

      if (button.disabled) return;

      if (button.getAttribute(LOCK_ATTRIBUTE) === 'true') {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      button.setAttribute(LOCK_ATTRIBUTE, 'true');
      button.setAttribute('aria-disabled', 'true');
      button.setAttribute('aria-busy', 'true');
      button.classList.add('global-button-locked');
      lockedButtons.add(button);

      // Let the current click event reach the React onClick/onSubmit handler.
      // Disable the native button immediately after that handler starts.
      setTimeout(() => {
        if (button.getAttribute(LOCK_ATTRIBUTE) === 'true') {
          button.disabled = true;
        }
      }, 0);

      // If this was a local UI action with no API request, release the lock.
      // For API actions, the Axios interceptor releases it as soon as all
      // requests started by the action have completed.
      [150, 600, 1500, 3000].forEach((delay) => {
        setTimeout(() => {
          if (button.getAttribute(LOCK_ATTRIBUTE) === 'true' && activeRequests === 0) {
            unlockButton(button);
          }
        }, delay);
      });
    };

    window.addEventListener('panipuri:api-start', handleRequestStart);
    window.addEventListener('panipuri:api-end', handleRequestEnd);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('panipuri:api-start', handleRequestStart);
      window.removeEventListener('panipuri:api-end', handleRequestEnd);
      unlockAll();
    };
  }, []);

  return null;
}
