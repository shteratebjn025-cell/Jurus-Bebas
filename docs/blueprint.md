# **App Name**: SilatScorer

## Core Features:

- Participant Data Management: Admin panel for adding, editing, and mass uploading participant data (name, contingent, gender, age category) via CSV template, storing data in Firestore.
- Match Configuration: Admin panel to configure match settings such as the number of judges (4 or 6), managing the progress to the next match.
- Judge Scoring Interface: Judges' interface to log in, select scores (0.5 for incorrect, 1 for correct) for each of the 59 jurus, and stamina (0.1 - 0.9). Judges can advance to the next jurus after scoring.
- Real-time Scoring Display: Display screen showing scores input by each judge in real-time.
- Score Monitoring and Confirmation: A real-time monitoring interface displaying individual judge scores, used to confirm scores and finalize results.
- Timer Management: A countdown timer page that can be configured from the admin panel and displayed in the display page.
- Final Results Display: Public display showing final scores, median, deviations, and total time once the monitoring confirms.

## Style Guidelines:

- Primary color: A strong, deep red (#8B0000) to reflect the intensity and tradition of Pencak Silat.
- Background color: Off-white (#FAF9F6), providing a clean and unobtrusive backdrop.
- Accent color: Gold (#FFD700) to highlight important elements like final scores and call-to-action buttons.
- Body font: 'PT Sans', a humanist sans-serif, for good readability in the body.
- Headline font: 'Playfair', a modern serif with an elegant, fashionable feel; pairing this with PT Sans.
- Use simple, strong icons to represent actions and data points.
- Subtle transitions and animations to enhance the real-time display of scores and timer updates.