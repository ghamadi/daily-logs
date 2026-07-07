// Scratch page to preview the typography utility classes. Not part of the app.
export default function TypographyDemoPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-16">
      <h1 className="typography-h1">The Joke Tax Chronicles</h1>

      <p className="typography-lead">
        Once upon a time, in a far-off land, there was a very lazy king who spent all day lounging on his
        throne.
      </p>

      <p className="typography-p">
        One day, his advisors came to him with a problem: the kingdom was running out of money. The king
        thought long and hard, and finally came up with{' '}
        <a href="#" className="font-medium underline underline-offset-4">
          a brilliant plan
        </a>
        : he would tax the jokes in the kingdom.
      </p>

      <h2 className="typography-h2">The King&apos;s Plan</h2>

      <p className="typography-p">
        The king thought about levying a tax on the jokes in the kingdom. After all, everyone loves a
        good joke, so it&apos;s only fair that they should pay for the privilege.
      </p>

      <blockquote className="typography-blockquote">
        &ldquo;After all,&rdquo; he said, &ldquo;everyone enjoys a good joke, so it&apos;s only fair that
        they should pay for the privilege.&rdquo;
      </blockquote>

      <h3 className="typography-h3">The Joke Tax</h3>

      <p className="typography-p">
        The king&apos;s subjects were not amused. They grumbled and complained, but the king was firm:
      </p>

      <ul className="typography-list">
        <li>1st level of puns: 5 gold coins</li>
        <li>2nd level of jokes: 10 gold coins</li>
        <li>3rd level of one-liners: 20 gold coins</li>
      </ul>

      <p className="typography-p">
        As a result, people stopped telling jokes, and the kingdom fell into a gloom. But there was one
        person who refused to let the king&apos;s foolishness get him down: a court jester named{' '}
        <code className="typography-code">Jester McJokeface</code>.
      </p>

      <h4 className="typography-h4">People stopped telling jokes</h4>

      <p className="typography-p">
        The people of the kingdom, feeling oppressed, decided to take matters into their own hands.
      </p>

      <h3 className="typography-h3">Inline text examples</h3>

      <p className="typography-large">This is large text — a slightly bigger, bolder line.</p>
      <p className="typography-small">This is small text — for fine print and labels.</p>
      <p className="typography-muted">This is muted text — for secondary, less important info.</p>

      <h3 className="typography-h3">Variant composition</h3>

      <p className="typography-muted">
        These are real utilities now, so variants compose. Resize the window: the next line is{' '}
        <code className="typography-code">typography-small</code> on mobile and{' '}
        <span className="typography-small md:typography-large">
          typography-large from the md breakpoint up
        </span>
        .
      </p>
    </div>
  );
}
