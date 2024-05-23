## Running the NextJS example

1. Use [ngrok](https://ngrok.com/) to test the webhook locally. Run `ngrok http 3000` and copy the URL.
2. Follow the instructions in the package readme to get a GitHub token.
3. Setup a GitHub Webhook. Use `https://my-ngrok-url/api/next-flag` as the payload URL for the Webhook.
4. Add the token and secret to `.env.local`.
5. Create a new issue with the contents below. Take note of the issue number.
6. Modify `src/app/api/next-flag/nf.ts` to include the repository and issue number.
7. Install the dependencies with `npm install`.
8. Start the NextJS app with `npm run dev`.
9. Modify the issue to see the changes reflected in the app.

```markdown
# 🏁 Feature Flags

## Next logo

- [x] Enabled

### Production

- [x] Enabled

### Preview

- [x] Enabled

### Development

- [ ] Enabled

## Vercel logo

- [x] Enabled

## Getting started

- [x] Enabled

## Footer

- [x] Enabled
```
