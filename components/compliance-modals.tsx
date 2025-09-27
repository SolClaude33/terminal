"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

export function TermsModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="text-xs text-muted-foreground p-0 h-auto">
          Terms
        </Button>
      </DialogTrigger>
      <DialogContent className="terminal-panel max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="terminal-glow">TERMS OF SERVICE</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-96">
          <div className="space-y-4 text-xs">
            <section>
              <h3 className="font-bold text-sm mb-2">1. DEMO PLATFORM NOTICE</h3>
              <p>
                This is a demonstration betting platform created for educational and entertainment purposes only. No
                real money, cryptocurrency, or financial instruments are involved in any transactions on this platform.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-sm mb-2">2. SIMULATED TRADING</h3>
              <p>
                All trading activities, price movements, and market data displayed on this platform are simulated using
                algorithmic generation. Results do not reflect real market conditions or actual trading outcomes.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-sm mb-2">3. AGE RESTRICTIONS</h3>
              <p>
                Users must be 18 years or older to access this platform. By using this service, you confirm that you
                meet the minimum age requirement in your jurisdiction.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-sm mb-2">4. NO FINANCIAL ADVICE</h3>
              <p>
                Nothing on this platform constitutes financial, investment, or trading advice. This is purely a
                demonstration of betting interface design and functionality.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-sm mb-2">5. INTELLECTUAL PROPERTY</h3>
              <p>
                The design, code, and concept of this terminal interface are protected by intellectual property rights.
                This is a portfolio demonstration project.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-sm mb-2">6. LIMITATION OF LIABILITY</h3>
              <p>
                The creators of this demonstration platform are not liable for any decisions made based on interaction
                with this simulated environment.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export function PrivacyModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="text-xs text-muted-foreground p-0 h-auto">
          Privacy
        </Button>
      </DialogTrigger>
      <DialogContent className="terminal-panel max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="terminal-glow">PRIVACY POLICY</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-96">
          <div className="space-y-4 text-xs">
            <section>
              <h3 className="font-bold text-sm mb-2">1. DATA COLLECTION</h3>
              <p>
                This demonstration platform operates entirely in your browser. No personal data, betting history, or
                user information is collected, stored, or transmitted to external servers.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-sm mb-2">2. LOCAL STORAGE</h3>
              <p>
                Any preferences or session data are stored locally in your browser and are not accessible to third
                parties. This data is automatically cleared when you close your browser session.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-sm mb-2">3. COOKIES</h3>
              <p>
                This platform may use essential cookies for basic functionality. No tracking or analytics cookies are
                used. No data is shared with advertising networks or third-party services.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-sm mb-2">4. THIRD-PARTY SERVICES</h3>
              <p>
                This demonstration does not integrate with any third-party services, payment processors, or external
                APIs that could access your data.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-sm mb-2">5. DATA SECURITY</h3>
              <p>
                Since no data is collected or transmitted, there are no data security concerns. All simulation data is
                generated locally and exists only during your session.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-sm mb-2">6. CONTACT</h3>
              <p>
                For questions about this privacy policy or the demonstration platform, this is a portfolio project
                created for educational purposes.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export function ResponsibleBettingModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="text-xs text-muted-foreground p-0 h-auto">
          Responsible Betting
        </Button>
      </DialogTrigger>
      <DialogContent className="terminal-panel max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="terminal-glow">RESPONSIBLE BETTING</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-96">
          <div className="space-y-4 text-xs">
            <section>
              <h3 className="font-bold text-sm mb-2">IMPORTANT NOTICE</h3>
              <p className="text-amber font-bold">
                This is a demonstration platform only. No real money is involved. However, we promote responsible
                gambling practices in real-world scenarios.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-sm mb-2">RESPONSIBLE GAMBLING PRINCIPLES</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li>Never bet more than you can afford to lose</li>
                <li>Set time and money limits before you start</li>
                <li>Don't chase losses with bigger bets</li>
                <li>Take regular breaks from gambling activities</li>
                <li>Don't gamble when upset, depressed, or under the influence</li>
                <li>Keep gambling as entertainment, not a way to make money</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-sm mb-2">WARNING SIGNS</h3>
              <p>Seek help if you experience:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Spending more time or money gambling than intended</li>
                <li>Lying about gambling activities</li>
                <li>Feeling anxious or depressed about gambling</li>
                <li>Borrowing money to gamble</li>
                <li>Neglecting work, family, or other responsibilities</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-sm mb-2">HELP RESOURCES</h3>
              <p>If you or someone you know has a gambling problem:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>National Problem Gambling Helpline: 1-800-522-4700</li>
                <li>Gamblers Anonymous: www.gamblersanonymous.org</li>
                <li>National Council on Problem Gambling: www.ncpgambling.org</li>
                <li>Crisis Text Line: Text HOME to 741741</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-sm mb-2">SELF-EXCLUSION</h3>
              <p>
                In real gambling platforms, self-exclusion tools allow you to restrict access to gambling services.
                Always use these tools if you feel your gambling is becoming problematic.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
