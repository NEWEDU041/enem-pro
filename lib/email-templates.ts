// Email templates for Resend integration
export const emailTemplates = {
  welcome: {
    subject: 'Seu cronograma ENEM 2026 está pronto! 📅',
    body: `Hi {firstName},

Welcome to ENEM Pro! 🎯

Your 90-day study schedule is ready. Download it now.

📚 What's included:
- Daily study plan (2-4h/day)
- By-subject breakdown
- Practice schedule
- Print + digital versions

→ Download: {downloadUrl}

Then start your FREE 7-day trial:
- 2,900+ practice questions
- Personalized study paths
- Weekly reports
- Expert tips

→ Start Trial: {trialUrl}

Questions? Reply anytime.

Best,
ENEM Pro Team`
  },

  socialProof: {
    subject: '+2,000 students passed using this ✨',
    body: `Hi {firstName},

"Went from 520 to 750 in 6 months!" - Ana, SP
"Most realistic practice questions." - Carlos, RJ  
"Finally a plan that works!" - Marina, BH

Ready to join them?

→ Start Free Trial: {trialUrl}
(No card. Cancel anytime.)

Best,
ENEM Pro Team`
  },

  weeklyTip: {
    subject: 'Mistake 95% of ENEM students make',
    body: `Hi {firstName},

Tip: Spending 70% of time on math.

ENEM tests 5 subjects equally. 20% each works better.

Our students report:
- 15% faster prep
- Balanced scores  
- Less anxiety

→ Study smarter: {trialUrl}

Best,
ENEM Pro Team`
  }
};
