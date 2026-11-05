import PocketBase from 'pocketbase';

const pb = new PocketBase('https://woolfolio.ru');

// ЭТА СТРОКА СПАСАЕТ ОТ ВЕЧНОЙ ЗАГРУЗКИ НА IPHONE
pb.autoCancellation(false);

export default pb;
