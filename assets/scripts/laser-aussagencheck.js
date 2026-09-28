(() => {
  const check = document.querySelector('.laser-aussagencheck');
  if (!check) return;

  const rows = [...check.querySelectorAll('tbody tr')];
  const result = check.querySelector('.laser-check-result');
  check.querySelector('.laser-check-actions').hidden = false;

  function clearFeedback() {
    result.textContent = '';
    rows.forEach(row => {
      const feedback = row.querySelector('.laser-check-feedback');
      feedback.hidden = true;
      feedback.textContent = '';
      feedback.removeAttribute('aria-label');
      feedback.removeAttribute('title');
      delete feedback.dataset.state;
    });
  }

  check.addEventListener('change', clearFeedback);
  check.querySelector('[data-action="check"]').addEventListener('click', () => {
    let correct = 0;
    let missing = 0;
    rows.forEach(row => {
      const selected = row.querySelector('input:checked');
      const feedback = row.querySelector('.laser-check-feedback');
      feedback.hidden = false;
      let description;
      if (!selected) {
        missing += 1;
        feedback.dataset.state = 'missing';
        feedback.textContent = '?';
        description = 'Noch nicht beantwortet.';
      } else if (selected.value === row.dataset.answer) {
        correct += 1;
        feedback.dataset.state = 'correct';
        feedback.textContent = '✓';
        description = 'Richtig beurteilt.';
      } else {
        feedback.dataset.state = 'incorrect';
        feedback.textContent = '✕';
        description = row.dataset.answer === 'ja'
          ? 'Falsch beurteilt. Diese Aussage trifft zu.'
          : 'Falsch beurteilt. Diese Aussage trifft nicht zu.';
      }
      feedback.setAttribute('aria-label', description);
      feedback.title = description;
    });
    result.textContent = `${correct} von ${rows.length} Aussagen richtig beurteilt.`
      + (missing ? ` Noch nicht beantwortet: ${missing}.` : '')
      + ' Zeichen: ✓ richtig, ✕ falsch, ? offen.'
      + ' Vergleiche auch deine Begründungen mit der aufklappbaren Lösung.';
  });

  check.querySelector('[data-action="reset"]').addEventListener('click', () => {
    check.querySelectorAll('input').forEach(input => { input.checked = false; });
    clearFeedback();
    check.querySelector('input').focus();
  });
})();
