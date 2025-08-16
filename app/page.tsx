// This is the new root page component.
// Its only purpose is to exist, so that Next.js has a page to render
// for the root URL ("/"). The middleware will intercept requests to "/"
// and redirect them to the appropriate locale (e.g., "/en") before this
// page is ever fully rendered. This makes the initial redirect very fast.

export default function RootPage() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Loading...</h1>
      <p>Please wait while we redirect you to the correct language version of the site.</p>
    </div>
  );
} 