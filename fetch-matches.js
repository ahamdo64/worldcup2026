const fetch = require('node-fetch');
const fs = require('fs');

async function fetchMatches() {
  const API_KEY = process.env.FOOTBALL_API_KEY;
  
  if (!API_KEY) {
    console.error('❌ خطأ: مفتاح API غير موجود!');
    process.exit(1);
  }

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  console.log('📅 جلب المباريات من', today, 'إلى', tomorrow);

  try {
    const response = await fetch(
      `https://api.football-data.org/v4/matches?dateFrom=${today}&dateTo=${tomorrow}`,
      {
        headers: { 'X-Auth-Token': API_KEY }
      }
    );

    console.log('📊 HTTP Status:', response.status);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ تم جلب ${data.matches.length} مباراة`);

    // قاموس الأعلام
    const teamFlags = {
      'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'Germany': '🇩🇪',
      'France': '🇫🇷', 'Spain': '🇪🇸', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      'Italy': '🇮🇹', 'Portugal': '🇵🇹', 'Netherlands': '🇳🇱',
      'Belgium': '🇧🇪', 'Mexico': '🇲🇽', 'USA': '🇺🇸',
      'Canada': '🇨🇦', 'Japan': '🇯🇵', 'South Korea': '🇰🇷',
      'Saudi Arabia': '🇸🇦', 'Egypt': '🇪🇬', 'Morocco': '🇲🇦',
      'Algeria': '🇩🇿', 'Tunisia': '🇹🇳', 'Qatar': '🇶🇦',
      'Iraq': '🇮🇶', 'Jordan': '🇯🇴', 'Australia': '🇦🇺',
      'Uruguay': '🇺🇾', 'Colombia': '🇨🇴', 'Croatia': '🇭🇷',
      'Ghana': '🇬🇭', 'Senegal': '🇸🇳', 'South Africa': '🇿🇦',
      'Sweden': '🇸🇪', 'Switzerland': '🇨🇭', 'Austria': '🇦🇹',
      'Denmark': '🇩🇰', 'Norway': '🇳🇴', 'Turkey': '🇹🇷',
      'Iran': '🇮🇷', 'Paraguay': '🇵🇾', 'Ecuador': '🇪🇨',
      'Czech Republic': '🇨🇿', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      'Bosnia and Herzegovina': '🇧🇦', 'Haiti': '🇭🇹',
      'Cape Verde': '🇨🇻', 'Curaçao': '🇨🇼',
      "Côte d'Ivoire": '🇨🇮', 'Congo DR': '🇨🇩',
      'Uzbekistan': '🇺🇿', 'Panama': '🇵🇦', 'New Zealand': '🇳🇿'
    };

    const matches = data.matches.map(match => {
      let status = 'upcoming';
      if (match.status === 'FINISHED') status = 'finished';
      else if (['IN_PLAY', 'PAUSED', 'TIMED'].includes(match.status)) status = 'live';

      let score = '- : -';
      if (match.score.fullTime.home !== null) {
        score = `${match.score.fullTime.home} - ${match.score.fullTime.away}`;
      }

      const homeFlag = teamFlags[match.homeTeam.shortName] || '⚽';
      const awayFlag = teamFlags[match.awayTeam.shortName] || '⚽';

      return {
        group: match.competition.name,
        date: match.utcDate.split('T')[0],
        team1: `${homeFlag} ${match.homeTeam.shortName}`,
        team2: `${awayFlag} ${match.awayTeam.shortName}`,
        score: score,
        status: status,
        utcDate: match.utcDate
      };
    });

    matches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
    
    fs.writeFileSync('matches.json', JSON.stringify(matches, null, 2));
    console.log('✅ تم حفظ', matches.length, 'مباراة في matches.json');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

fetchMatches();
