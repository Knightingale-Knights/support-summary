# support-summary

Generates a branded NDIS support summary PowerPoint from a participant's last
3 months of progress notes, using Claude to draft the content.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `BUBBLE_APP_URL` — your Bubble app base URL (version-live or version-test)
   - `BUBBLE_API_TOKEN` — Bubble Data API token
   - `ANTHROPIC_API_KEY`
   - `ANTHROPIC_MODEL` (optional, defaults to `claude-sonnet-5`)
3. Check `lib/bubble.js` `FIELDS` object matches your actual Bubble field
   names for the User (participant) type and Progress Note type.
4. `vercel deploy`

## Endpoint

`POST /api/generate-summary`

Body:
```json
{ "participant_id": "BUBBLE_UNIQUE_ID", "months_back": 3 }
```

Response:
```json
{
  "participant_id": "...",
  "participant_name": "...",
  "report_period": "11/02/26 - 04/03/26",
  "session_count": 4,
  "filename": "Joseph_Hubay_Supports_Summary.pptx",
  "file_base64": "..."
}
```

## Wiring into Bubble

1. Add this endpoint to the Bubble API Connector as a POST action, body
   param `participant_id` (and optionally `months_back`).
2. On the participant page, add a "Create Support Summary" button.
3. Button workflow:
   - Step 1: Call the API Connector action, passing the participant's
     unique id.
   - Step 2: Send email via Postmark, attaching `file_base64` decoded as
     `filename` (Postmark's Bubble plugin accepts a base64 attachment).
4. Optional: show a loading state between steps 1 and 2, since Claude
   drafting + pptx generation can take several seconds.

## Notes

- Brand fonts (Bethany Elingston, Geist) are not embedded — `lib/theme.js`
  currently falls back to Georgia/Calibri so the deck renders correctly on
  any machine. Swap in the real fonts once embedded or confirmed available
  org-wide.
- Claude only uses what's in the progress notes; it won't invent names,
  events, or clinical claims.
