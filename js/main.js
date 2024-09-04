let authors = [];
let groupingType = 0;
let worksPerGroup = 8;
let numberOfGroups = 2;
let prevDistrValue = 0;
let grelkaMode = false;
let printedGroups = [];

function parse(value) {
  if (/[\\<>]/.test(value)) {
    return {
      title: '[Ошибка] В тексте содержится один или несколько запрещённых символов: \\ < >',
      messages: []
    };
  }

  const lines = value.split(/[\t\n]+/).map(v => v.trim()).filter(v => !!v);

  const authors = [];
  let current_author;
  let current_entry;
  const count = lines.length - lines.length % 3;
  for (let i = 0; i < count; i++) {
    const str = lines[i];

    // Имя автора
    if (i % 3 === 0) {
      current_author = authors.find(obj => obj.name === str);
      if (!current_author) {
        current_author = {
          name: str,
          entries: []
        };
        authors.push(current_author);
      }
    // Название произведения
    } else if (i % 3 === 1) {
      if (current_author.entries.some(obj => obj.title === str)) {
        return {
          title: '[Ошибка] Несколько произведений с идентичным названием от одного автора',
          messages: [
            `Автор: ${current_author.name}`,
            `Произведение: ${str}`
          ]
        };
      }
      current_entry = {
        title: str,
        size: 0
      };
      current_author.entries.push(current_entry);
    // Объём произведения
    } else {
      let size = +(str.replaceAll(',', '.'));
      if (isNaN(size) || !isFinite(size) || size < 0) {
        return {
          title: '[Ошибка] Неверно указан объём произведения',
          messages: [
            `Автор: ${current_author.name}`,
            `Произведение: ${current_entry.title}`
          ]
        };
      }
      current_entry.size = size;
    }
  }
  authors.sort((a, b) => a.name < b.name ? -1 : 1);
  authors.forEach((author) => {
    let mainEntry;
    author.entries.forEach((entry) => {
      if (!mainEntry || mainEntry.size <= entry.size) {
        mainEntry = entry;
      }
      entry.author = author.name;
      entry.weight = entry.size + (entry.size * Math.random() * 0.2);
    });
    mainEntry.main = true;
    author.entries.sort((a, b) => a.size < b.size ? -1 : 1);
  });
  // console.log(authors);
  return authors;
}

function makeGroups(authors) {
  const entries = [];
  for (const author of authors) {
    entries.push(...author.entries);
  }
  entries.sort((a, b) => a.weight > b.weight ? -1 : 1);

  let groups_count = 2;
  if (groupingType === 0) {
    groups_count = Math.max(Math.round(entries.length / worksPerGroup), 2);
  } else {
    groups_count = numberOfGroups;
  }

  const groups = Array(groups_count).fill().map(() => []);

  const mainEntries = [];
  const otherEntries = [];

  entries.forEach((entry) => {
    if (entry.main) {
      mainEntries.push(entry);
    } else {
      otherEntries.push(entry);
    }
  });

  // Сначала распределяем "основные" произведения участников.
  while (mainEntries.length) {
    getRandomSmallestArray(groups).push(mainEntries.pop());
  }

  // Если от участника разрешена только одна работа, на этом всё.
  if (!otherEntries.length) {
    return groups;
  }

  // Если же произведений больше, чем авторов, задача усложняется.
  return makeGroupsAdvanced(groups, otherEntries);
}

function makeGroupsAdvanced(groups, entries) {
  const SIZE_EXCESS_PENALTY = 1;
  const SAME_AUTHOR_PENALTY = 1;
  const SELF_VOTING_PENALTY = grelkaMode ? 0 : 5;
  let totalValue = 0;

  while (entries.length) {
    const entry = entries.shift();
    const values = [];
    const votesFrom = groups.findIndex(group => group.some(obj => obj.author === entry.author && obj.main));
    const smallestGroupLength = getRandomSmallestArray(groups).length;
    groups.forEach((group, i) => {
      let v = 0;
      v += (group.length - smallestGroupLength) * SIZE_EXCESS_PENALTY;
      v += group.filter(obj => obj.author === entry.author).length * SAME_AUTHOR_PENALTY;
      if (votesFrom === i) {
        const nextGroup = i < groups.length - 1 ? groups[i + 1] : groups[0];
        v += nextGroup.filter(obj => obj.author === entry.author).length * SELF_VOTING_PENALTY;
      } else if (votesFrom === i > 0 ? i - 1 : groups.length - 1) {
        const prevGroup = i > 0 ? groups[i - 1] : groups.at(-1);
        v += prevGroup.filter(obj => obj.author === entry.author).length * SELF_VOTING_PENALTY;
      }
      values[i] = v;
    });
    const index = getRandomSmallestValueIndex(values);
    totalValue += values[index];
    // console.log(values, values[index], totalValue);
    groups[index].push(entry);
  }

  prevDistrValue = totalValue;
  return groups;
}

function createGroups(attempts = 5) {
  if (authors.length < 2) {
    return;
  }
  let maxDistrValue = Infinity;
  let bestResult;
  // console.log('attempts:', attempts);
  for (let i = 0; i < attempts; i++) {
    const groups = makeGroups(authors);
    if (prevDistrValue < maxDistrValue) {
      maxDistrValue = prevDistrValue;
      bestResult = groups;
    }
  }
  printedGroups = bestResult;
  printGroups(bestResult);
}

function getRandomSmallestArray(list) {
  let min = Infinity;
  list.forEach((arr) => {
    if (arr.length < min) {
      min = arr.length;
    }
  });
  return sample(list.filter(arr => arr.length === min));
}

function getRandomSmallestValueIndex(list) {
  let min = Infinity;
  let indices = [];
  list.forEach((val, i) => {
    if (val < min) {
      min = val;
      indices = [i];
    } else if (val === min) {
      indices.push(i);
    }
  });
  return sample(indices);
}

function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function process(text, attempts) {
  // console.clear();
  const result = parse(text);
  if (Array.isArray(result)) {
    authors = result;
    printAuthors(result);
    createGroups(attempts);
  } else {
    printError(result);
  }
}

function setGroupingType(n) {
  groupingType = n;
  updateGroupingMenu();
  createGroups();
}

function updateGroupingMenu() {
  if (groupingType === 0) {
    document.querySelector('.by-number-of-groups').querySelectorAll('input, button').forEach(el => { el.disabled = 'disabled' });
    document.querySelector('.by-works-per-group').querySelectorAll('input, button').forEach(el => { el.disabled = '' });
  } else {
    document.querySelector('.by-works-per-group').querySelectorAll('input, button').forEach(el => { el.disabled = 'disabled' });
    document.querySelector('.by-number-of-groups').querySelectorAll('input, button').forEach(el => { el.disabled = '' });
  }
}

function setGroupingParameter(n) {
  if (groupingType === 0) {
    if (n === undefined) {
      n = parseInt(document.querySelector('.group-size-input').value);
    }
    worksPerGroup = n;
  } else {
    if (n === undefined) {
      n = parseInt(document.querySelector('.groups-count-input').value);
    }
    numberOfGroups = n;
  }
  createGroups();
}

function setGrelkaMode(bool) {
  grelkaMode = bool;
  createGroups();
}
