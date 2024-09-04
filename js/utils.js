function div(...classes) {
  const el = document.createElement('div');
  el.classList.add(...classes.filter(str => !!str));
  return el;
}

function span(...classes) {
  const el = document.createElement('span');
  el.classList.add(...classes.filter(str => !!str));
  return el;
}

function printAuthors(authors) {
  let total_authors = 0;
  let total_entries = 0;
  let total_size = 0;
  const $authors = document.querySelector('.authors');
  $authors.replaceChildren();
  for (const author of authors) {
    total_authors += 1;
    const $author = div('author');
    const $name = span('entry-author');
    $name.innerText = author.name;
    const $entries = div('entries');
    for (const entry of author.entries) {
      total_entries += 1;
      total_size += entry.size;
      const $entry = div('entry');
      (() => {
        const $span1 = span('entry-size');
        $span1.innerText = entry.size;
        const $span2 = span('entry-title');
        $span2.innerText = entry.title;
        $entry.append($span1, $span2);
      })();
      $entries.append($entry);
    }
    $author.append($name, $entries);
    $authors.append($author);
  }
  printStats(total_authors, total_entries, total_size);
}

function printError(error) {
  const $authors = document.querySelector('.authors');
  $authors.replaceChildren();
  const $error = div('author');
  const $title = span();
  $title.innerText = error.title;
  const $messages = div('entries');
  for (const message of error.messages) {
    const $message = div('entry');
    $message.innerText = message;
    $messages.append($message);
  }
  $error.append($title, $messages);
  $authors.append($error);
  printStats(0, 0, 0);
}

function printStats(a, b, c) {
  document.querySelector('.total-authors > span').innerText = a;
  document.querySelector('.total-entries > span').innerText = b;
  document.querySelector('.total-size > span').innerText = c;
}

function printGroups(groups) {
  const $groups = document.querySelector('.groups');
  $groups.replaceChildren();
  groups.forEach((group, i) => {
    const judges = [];
    if (!grelkaMode) {
      const prev_group = groups[i ? i - 1 : groups.length - 1];
      for (const entry of prev_group) {
        if (entry.main) {
          judges.push(entry.author);
        }
      }
    }
    const voters = [];
    group.sort((a, b) => a.size > b.size ? 1 : -1);
    let entries_size = 0;
    let authors = [];
    for (const entry of group) {
      entries_size += entry.size;
      if (entry.main) {
        voters.push(entry.author);
      }
      if (!authors.includes(entry.author)) {
        authors.push(entry.author);
      }
    }
    const $group = div('group');
    const $title = div('title');
    const $summary = div('summary');
    (() => {
      const $span = span('unselectable');
      $span.innerText = `${i + 1} группа`; 
      $title.append($span);
    })();
    $group.append($title);
    $summary.innerHTML =
      `<span class="unselectable"><span class="entries-count"></span> работ от <span class="authors-count"></span> авторов (объём: <span class="entries-size"></span>)<br>` +
      `Голосуют от группы: <span class="voters-count"></span>`;
    $summary.querySelector('.entries-count').innerText = group.length;
    $summary.querySelector('.authors-count').innerText = authors.length;
    $summary.querySelector('.voters-count').innerText = voters.length;
    $summary.querySelector('.entries-size').innerText = entries_size;
    $group.append($summary);
    const dict = {};
    for (const entry of group) {
      if (Object.hasOwn(dict, entry.author)) {
        dict[entry.author] += 1;
      } else {
        dict[entry.author] = 1;
      }
      const $entry = div('entry');
      (() => {
        const $span1 = span('entry-size', 'unselectable');
        $span1.innerText = entry.size;
        const $span2 = span('entry-title', judges.includes(entry.author) ? 'entry-self-rated' : '');
        $span2.innerText = entry.title;
        const $span4 = span('entry-author', 'unselectable', entry.main ? 'voter' : '');
        $span4.innerText = entry.author;
        $entry.append($span1, $span2);
        if (dict[entry.author] > 1) {
          const $span3 = span('entry-same-author', 'unselectable');
          $span3.innerText = dict[entry.author];
          $entry.append($span3);
        }
        $entry.append($span4);
      })();
      $group.append($entry);
    }
    if (i < groups.length - 1) {
      const $br = document.createElement('br');
      $group.append($br);
    }
    $groups.append($group);
  });
}

function showGrelkaModeHelp() {
  alert(
    'Распределение как на литературном конкурсе "Рваная Грелка".\u000a\u000a' +
    'Крупные группы и голосование путём составления топов позволяют не заботиться о том, ' +
    'что некоторые работы автора попадут в подсудную ему же группу (брать свои произведения ' +
    'в собственный топ запрещено).\u000a\u000a' +
    'Работы в этом режиме распределяются без оглядки на то, какую группу оценивают их авторы, ' +
    'соответствующее визуальное предостережение будет также отключено.'
  );
}
