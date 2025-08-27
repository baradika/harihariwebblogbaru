export class TableOfContent extends HTMLElement {
  private _current: HTMLAnchorElement | null = null;
  private observer: IntersectionObserver | null = null;
  private resizeTimeout: NodeJS.Timeout | null = null;
  private links: HTMLAnchorElement[] = [];

  protected get current(): HTMLAnchorElement | null {
    return this._current;
  }

  protected set current(link: HTMLAnchorElement | null) {
    if (link === this._current || !link) {
      return;
    }

    if (this._current) {
      this._current.removeAttribute('aria-current');
    }

    link.setAttribute('aria-current', 'true');
    this._current = link;
  }

  private onIdle = (cb: IdleRequestCallback) =>
    (window.requestIdleCallback || ((cb) => setTimeout(cb, 1)))(cb);

  constructor() {
    super();
    this.onIdle(() => this.init());
  }

  private init(): void {
    this._current = this.querySelector<HTMLAnchorElement>('a[aria-current="true"]');
    this.links = Array.from(this.querySelectorAll<HTMLAnchorElement>('a'));

    this.setupObservers();

    document.addEventListener('resize', () => {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }

      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }

      this.resizeTimeout = setTimeout(() => {
        this.setupObservers();
      }, 250);
    });
  }

  private setupObservers(): void {
    const toObserve = document.querySelectorAll('main [id], main [id] ~ *');

    this.observer = new IntersectionObserver(this.handleIntersection, {
      root: null,
      rootMargin: this.getRootMargin(),
      threshold: 0
    });

    toObserve.forEach(element => this.observer?.observe(element));
  }

  private handleIntersection: IntersectionObserverCallback = (entries) => {
    for (const { isIntersecting, target } of entries) {
      if (!isIntersecting) continue;

      const heading = this.findAssociatedHeading(target);
      if (!heading) continue;

      const headingId = encodeURIComponent(heading.id);
      const link = this.links.find(link => link.hash === '#' + headingId);

      if (link) {
        this.current = link;
        break;
      }
    }
  };

  private findAssociatedHeading(element: Element): HTMLHeadingElement | null {
    if (!element) {
      return null;
    }

    if (this.isHeading(element)) {
      return element as HTMLHeadingElement;
    }

    // Check if the previous sibling is a heading
    if (element.previousElementSibling && this.isHeading(element.previousElementSibling)) {
      return element.previousElementSibling as HTMLHeadingElement;
    }

    // Only recursively check if we don't have a current heading
    return this.current ? null : this.findAssociatedHeading(element.previousElementSibling as Element);
  }

  private isHeading(element: Element | null): boolean {
    if (!element || !(element instanceof HTMLHeadingElement)) {
      return false;
    }

    if (element.id === '_halll') {
      return true;
    }

    const level = element.tagName[1];
    if (level) {
      const int = parseInt(level, 10);
      return int >= 2 && int <= 3;
    }

    return false;
  }

  private getRootMargin(): `-${number}px 0% ${number}px` {
    const header = document.querySelector('header');
    const summary = this.querySelector('summary');

    const navBarHeight = header?.getBoundingClientRect().height || 0;
    const mobileTocHeight = summary?.getBoundingClientRect().height || 0;

    const top = navBarHeight + mobileTocHeight + 32;
    const bottom = top + 48;
    const height = document.documentElement.clientHeight;

    return `-${top}px 0% ${bottom - height}px`;
  }
}

customElements.define('z-toc', TableOfContent);
