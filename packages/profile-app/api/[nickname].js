export default async function handler(req, res) {
  const { nickname } = req.query;

  // Only handle bot requests - let others fall through to React app
  const userAgent = req.headers['user-agent'] || '';
  const isBot = /bot|crawler|spider|facebookexternalhit|twitterbot/i.test(
    userAgent,
  );

  if (!isBot) {
    // Let non-bots get the React app
    return res.status(404).end();
  }

  try {
    const response = await fetch(`https://api.jazz.dev/${nickname}`, {
      headers: {
        'User-Agent': userAgent,
      },
    });

    if (!response.ok) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html><head><title>Profile Not Found</title></head>
        <body><h1>Profile @${nickname} not found</h1></body></html>
      `);
    }

    const html = await response.text();

    // Replace API URLs with profile URLs for clean social sharing
    const cleanHtml = html
      .replace(/https:\/\/api\.jazz\.dev/g, 'https://profile.jazz.dev')
      .replace(/api\.jazz\.dev/g, 'profile.jazz.dev');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(cleanHtml);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).send('Internal server error');
  }
}
