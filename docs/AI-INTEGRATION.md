# AI integration

AgriGuide calculates rankings in its deterministic server-side crop engine before any AI call. The Gemini advisor cannot select or reorder crops.

The API accepts a saved analysis ID, verifies that it belongs to the signed-in user, and sends only that analysis's farm snapshot, weather data, top three crop information, scores, and risks to Gemini `gemini-2.5-flash`. Gemini is asked for JSON containing a summary, reasons, action plan, risk explanation, water advice, and weather advice. Zod validates the result before it is saved to `ai_outputs` and returned.

The Gemini key is never sent to the browser. If the key, network, or model response is unavailable or invalid, the API returns a friendly advisor error; the saved deterministic recommendations remain available.
