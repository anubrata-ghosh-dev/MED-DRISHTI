# Med-Drishti Infrastructure

## Production topology

- **Frontend:** Vercel, using the `frontend` directory as the project root.
- **Backend:** Render Web Service, configured by [`../render.yaml`](../render.yaml).
- **Database:** Render PostgreSQL, provisioned by the same blueprint.

## Render deployment

1. Create a Render Blueprint from this repository and apply `render.yaml`.
2. Set `CORS_ORIGINS` on `med-drishti-api` to the final Vercel origin.
3. Add `SARVAM_API_KEY` only if hosted speech, translation, or AI features are enabled.
4. Run the database initialization/migration command from a one-off Render shell before accepting traffic:
   `python ../scripts/setup_remote_db.py --url "$DATABASE_URL"`
5. Confirm `https://<backend-host>/api/v1/health` returns `{"status":"ok"}`.

## Vercel deployment

1. Create a Vercel project with `frontend` as its Root Directory.
2. Keep the detected Next.js framework and use `npm ci` / `npm run build`.
3. Set `NEXT_PUBLIC_API_BASE_URL` to the Render backend origin.
4. Redeploy after the Render URL is known, then verify registration, consent, intake, document upload, and doctor review flows.

Never commit `.env` files or production credentials. Use Render and Vercel secret/environment-variable stores.
