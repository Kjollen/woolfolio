import PocketBase from 'pocketbase';

const pb = new PocketBase('https://woolfolio.ru');

// ЭТА СТРОКА КРИТИЧЕСКИ ВАЖНА для Safari
pb.autoCancellation(false);

export default pb;
