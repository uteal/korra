document.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll('.numeric-input').forEach(el => el.addEventListener('input', () => {
    const val = parseInt(el.value);
    if (val !== +el.value || val < parseInt(el.getAttribute('min')) || val > parseInt(el.getAttribute('max'))) {
      el.classList.add('error');
    } else {
      el.classList.remove('error');
      setGroupingParameter();
    }
  }));

  document.querySelectorAll('.numeric-input').forEach(el => el.addEventListener('blur', () => {
    if (el.classList.contains('error')) {
      el.classList.remove('error');
      el.value = [worksPerGroup, numberOfGroups][groupingType];
    } else {
      el.value = parseInt(el.value);
    }
  }));

  document.querySelectorAll('.button-sub').forEach(el => el.addEventListener('click', () => {
    const input = el.parentElement.querySelector('.numeric-input');
    const min = parseInt(input.getAttribute('min'));
    const cur = parseInt(input.value);
    el.parentElement.querySelector('input[type="radio"]').checked = 'checked';
    if (cur > min) {
      input.value = cur - 1;
      setGroupingParameter();
    }
  }));

  document.querySelectorAll('.button-add').forEach(el => el.addEventListener('click', () => {
    const input = el.parentElement.querySelector('.numeric-input');
    const max = parseInt(input.getAttribute('max'));
    const cur = parseInt(input.value);
    el.parentElement.querySelector('input[type="radio"]').checked = 'checked';
    if (cur < max) {
      input.value = cur + 1;
      setGroupingParameter();
    }
  }));

  const $textarea = document.querySelector('textarea');

  $textarea.addEventListener('input', () => {
    process($textarea.value);
  });

  document.querySelector('.btn-check-unique').addEventListener('click', () => {
    if (!authors.length) {
      alert('Сначала добавьте участников.');
      return;
    }
    const entries = {};
    for (const author of authors) {
      for (const entry of author.entries) {
        if (Object.hasOwn(entries, entry.title)) {
          entries[entry.title] += 1;
        } else {
          entries[entry.title] = 1;
        }
      }
    }
    const duplicates = Object.entries(entries).filter(a => a[1] > 1).sort((a, b) => a[0] < b[0] ? -1 : 1);
    if (duplicates.length) {
      let message = 'Произведения с совпадающими названиями:\n\n';
      for (const [title, amount] of duplicates) {
        message += `${title} (${amount} шт)\n`
      }
      alert(message);
    } else {
      alert('Совпадений не найдено.');
    }
  });

  document.querySelector('.btn-show-stats').addEventListener('click', () => {
    if (!authors.length) {
      alert('Сначала добавьте участников.');
      return;
    }
    let entries_count = 0;
    let total_size = 0;
    let min_size = Infinity;
    let max_size = -Infinity;
    let max_entries_per_author = 0;
    let max_size_per_author = 0;
    for (const author of authors) {
      if (author.entries.length > max_entries_per_author) {
        max_entries_per_author = author.entries.length;
      }
      let size_per_author = 0;
      for (const entry of author.entries) {
        entries_count += 1;
        size_per_author += entry.size;
        total_size += entry.size;
        if (entry.size < min_size) {
          min_size = entry.size;
        }
        if (entry.size > max_size) {
          max_size = entry.size
        }
      }
      if (size_per_author > max_size_per_author) {
        max_size_per_author = size_per_author;
      }
    }
    let average_size = total_size / entries_count;
    if (!Number.isInteger(average_size)) {
      average_size = average_size.toFixed(2);
    }
    alert([
      'Авторов: ' + authors.length,
      'Произведений: ' + entries_count,
      '',
      'Минимальный объём: ' + min_size,
      'Максимальный объём: ' + max_size,
      'Средний объём: ' + average_size,
      'Общий объём: ' + total_size,
      '',
      'Максимум произведений от автора: ' + max_entries_per_author,
      'Максимальный объём от автора: ' + max_size_per_author
    ].join('\n'));
  });

  const excelScreen = document.querySelector('.excel-screen');
  const excelTextarea = document.querySelector('.excel-textarea');

  document.querySelector('.btn-copy-for-excel').addEventListener('click', () => {
    if (!printedGroups.length) {
      return;
    }
    const lines = ['Размер\tНазвание\tАвтор\tГолосует'];
    for (const group of printedGroups) {
      lines.push('');
      for (const { size, title, author, main } of group) {
        lines.push(`${size}\t${title}\t${author}\t${main ? 'Да' : ''}`);
      }
    }
    excelTextarea.value = lines.join('\n');
    excelScreen.classList.remove('display-none');
    requestAnimationFrame(() => {
      excelTextarea.focus();
      excelTextarea.select();
    });
  });

  excelScreen.addEventListener('click', ({ target }) => {
    if (target === excelScreen) {
      excelScreen.classList.add('display-none');
    }
  });

  document.querySelector('.btn-recalculate').addEventListener('click', () => {
    process($textarea.value, 10);
  });

  document.querySelector('.btn-set-dummy-data').addEventListener('click', () => {
    if ($textarea.value) {
      if (!confirm('Введённые ранее данные будут потеряны. Продолжить?')) {
        return;
      }
    }
    $textarea.value = sample_data;
    process($textarea.value);
  });

  updateGroupingMenu();

});
