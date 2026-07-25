# OMGSocial (This Is for Devs Only)

A minimal static demo of a 3D-looking social feed (HTML/CSS/JS).

How to open:

- Open `index.html` in a browser (double-click or use Live Server).

What I included:

- `index.html` — layout and structure
- `styles.css` — gradients, 3D card styles, responsive layout
- `app.js` — sample posts and tilt interactions
- `assets/logo.svg` — simple gradient logo
 - `app.js` — sample posts, tilt interactions, and client-side account persistence
 - `assets/logo.svg` — simple gradient logo

Next steps you might want:

- Add persistent storage (localStorage or backend)
 - Note: this demo uses `localStorage` for accounts and posts. Register or edit your profile via the top-right account area. You can upload an avatar image which is stored as a data URL locally.
- Replace placeholder avatars and content with real data
- Add animations, likes, replies, and routing

How to use the new account features:

- Click "Register / Login" in the top-right to create your account (name, handle, avatar).
- Once registered, compose posts; your posts will show edit and delete buttons.
- Click a post's "Edit" to modify it, or "Delete" to remove it (client-side only).

To reset data during development, open the browser console and run:

```javascript
localStorage.removeItem('3d_user');
localStorage.removeItem('3d_posts');
```
