import PocketBase from 'pocketbase';

const pb = new PocketBase('https://woolfolio.ru');

// ЭТА СТРОКА КРИТИЧЕСКИ ВАЖНА для Safari и React 18!
// Она запрещает SDK отменять запросы при двойном рендере
pb.autoCancellation(false);

export default pb;
