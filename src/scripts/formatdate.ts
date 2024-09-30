function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th'; // General case for numbers like 11, 12, 13, etc.
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

function formatCustomDate(date: Date): string {
  const day = date.getDate();
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  const hours = date.getHours() % 12 || 12; // Handle 12-hour format
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const AmPm = date.getHours() >= 12 ? 'PM' : 'AM';

  const ordinalSuffix = getOrdinalSuffix(day);

  return `${day}${ordinalSuffix} ${month} ${year}, ${hours}:${minutes}:${seconds} ${AmPm}`;
}

export default formatCustomDate;
