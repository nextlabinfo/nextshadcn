import { siGithub, siX } from "simple-icons";

import { SimpleIcon } from "@/components/simple-icon";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer>
      <div className="flex flex-row items-center justify-between gap-6 text-muted-foreground text-sm">
        <p>
          Brought to you by{" "}
          <a
            className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            href="https://github.com/nextlabinfo"
            target="_blank"
            rel="noreferrer"
          >
          @nextlabinfo
          </a>
        </p>
        <div className="flex items-center gap-3">
          <Button asChild size="icon-sm" variant="link">
            <a
              href="https://github.com/nextlabinfo/nextshadcn"
              target="_blank"
              rel="noreferrer"
              aria-label="Visit @nextlabinfo on GitHub"
            >
              <SimpleIcon icon={siGithub} aria-hidden className="size-4.5 fill-current" />
            </a>
          </Button>
        </div>
      </div>
    </footer>
  );
}
