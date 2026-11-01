import { HELP_SECTIONS, helpContent } from '../helpContent.js';

export class HelpScreen {
  private built = false;
  constructor(
    private readonly container: HTMLElement,
    private readonly onBack: () => void,
  ) {
    container.className = 'help-screen';
    container.dataset.screen = 'help';
  }
  render(): void {
    if (this.built) return;
    this.built = true;
    const header = document.createElement('header');
    header.className = 'help__header';
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'main-menu__btn';
    back.dataset.action = 'back';
    back.textContent = '← В меню';
    back.addEventListener('click', this.onBack);
    const title = document.createElement('h1');
    title.textContent = 'Помощь';
    header.append(back, title);
    const body = document.createElement('div');
    body.className = 'help__body';
    const navigation = document.createElement('nav');
    navigation.className = 'help__nav';
    navigation.setAttribute('aria-label', 'Разделы помощи');
    for (const [id, name] of HELP_SECTIONS) {
      const link = document.createElement('a');
      link.href = `#help-${id}`;
      link.textContent = name;
      navigation.append(link);
    }
    const article = document.createElement('article');
    article.className = 'help__article';
    article.innerHTML = helpContent();
    body.append(navigation, article);
    this.container.append(header, body);
  }
  getContainer(): HTMLElement {
    return this.container;
  }
}
