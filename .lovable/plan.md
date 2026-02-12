
## Fix: Mindbody OAuth Connection Flow

### Problem
When you tap "Connect Mindbody Account," the app opens a popup directly to the backend function URL. But that function expects to receive data as a POST request with a JSON body. Since the popup opens it as a regular page load (GET request), the function crashes with "Unexpected end of JSON input" and you see a broken page instead of the Mindbody login.

### Solution
Change the flow so the app first calls the backend function properly (as a background request), gets back the Mindbody login URL, and then opens that URL in the popup.

---

### Technical Details

**File: `src/contexts/MindbodyContext.tsx`**

Update the `linkMindbody` function to:

1. First, make a `fetch` POST request to `mindbody-oauth-init` with `{ redirectUri }` in the JSON body
2. Parse the response to get the `authUrl`
3. Then open the popup with that `authUrl` (the actual Mindbody sign-in page)

Current broken flow:
```text
User clicks Connect --> Popup opens backend URL (GET) --> Error
```

Fixed flow:
```text
User clicks Connect --> fetch POST to backend --> Get authUrl --> Popup opens Mindbody login
```
