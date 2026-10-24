import RequestForm from "./request-form";

export default function Home() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#case" aria-label="Закрытая галерея — к витрине дела"><span className="brand-mark" aria-hidden="true">г.</span><span>ЗАКРЫТАЯ<br />ГАЛЕРЕЯ</span></a>
        <span className="header-note">Искусство сохраняет следы.</span>
        <nav className="header-nav" aria-label="Разделы страницы">
          <a className="header-link" href="#case">Витрина дела</a>
          <a className="header-link" href="#reasons">Основания для контакта</a>
          <a className="header-link" href="#request">Связаться с галереей <span aria-hidden="true">↗</span></a>
        </nav>
      </header>

      <main>
        <div className="case-column">
          <section id="case" className="case-intro" aria-labelledby="case-title">
            <div className="eyebrow"><span className="status-dot" /> Витрина дела <span className="case-number">ДЕЛО № 001</span></div>
            <h1 id="case-title">У каждой картины<br />есть <em>предыстория.</em></h1>
            <p className="intro-copy">У этой — пока нет. Закрытая галерея принимает первичные обращения по делу о картине без происхождения. Возможно, ваша деталь поможет восстановить её путь.</p>
          </section>

          <div className="gallery-wall" aria-label="Репродукции пейзажей из открытых музейных коллекций">
            <figure className="artwork artwork-one"><div className="picture-frame"><img src="/art/mountains.jpg" alt="Альберт Бирштадт — гора Коркоран" width="800" height="506" /></div><figcaption>А. Бирштадт <span>·</span> Гора Коркоран</figcaption></figure>
            <figure className="artwork artwork-two"><div className="picture-frame"><img src="/art/garden.jpg" alt="Клод Моне — сад художника в Ветёе, дорожка к дому" width="639" height="800" /></div><figcaption>К. Моне <span>·</span> Сад в Ветёе</figcaption></figure>
            <figure className="artwork artwork-three"><div className="picture-frame"><img src="/art/estate.jpg" alt="Поль Сезанн — Шато-Нуар, усадьба среди деревьев" width="800" height="608" /></div><figcaption>П. Сезанн <span>·</span> Шато-Нуар</figcaption></figure>
            <span className="gallery-note">Фрагменты истории / открытая коллекция</span>
          </div>

          <section id="reasons" className="reasons" aria-labelledby="reasons-title">
            <h2 id="reasons-title">Основания для контакта</h2>
            <p className="reasons-intro">Необязательно знать всё. Достаточно одной зацепки.</p>
            <ol>
              <li><span>01</span><p>Вы узнаёте место<br />или сюжет картины.</p></li>
              <li><span>02</span><p>Вы встречали её<br />в частной коллекции.</p></li>
              <li><span>03</span><p>У вас есть сведения<br />о прежних владельцах.</p></li>
            </ol>
            <p className="reasons-note">Первый контакт — повод для аккуратной консультации.</p>
          </section>
        </div>

        <section id="request" className="request-panel" aria-labelledby="request-title">
          <div className="panel-top"><span className="eyebrow">Начать разговор</span><span className="panel-symbol" aria-hidden="true">✳</span></div>
          <h2 id="request-title">Первичный запрос</h2>
          <p className="panel-description">Оставьте контакт и ваши ожидания.<br />Любая история начинается со знакомства.</p>
          <RequestForm />
          <div className="panel-footer"><span aria-hidden="true">◈</span><p>Без документов и подробностей дела.<br />Только то, что нужно для первого контакта.</p></div>
        </section>
      </main>

      <footer className="site-footer"><span>© Закрытая галерея, 2026</span><span>Учебный проект <span className="footer-dot">·</span> Репродукции создают атмосферу и не являются предметом дела.</span></footer>
    </div>
  );
}
