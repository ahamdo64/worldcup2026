const fetch = require('node-fetch');
const fs = require('fs');

async function fetchMatches() {
  const API_KEY = process.env.FOOTBALL_API_KEY;
  
  if (!API_KEY) {
    console.error('❌ خطأ: مفتاح API غير موجود!');
    process.exit(1);
  }

  // جلب مباريات آخر 24 ساعة + اليوم + غد
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  console.log('📅 جلب المباريات من', yesterday, 'إلى', tomorrow);

  try {
    const response = await fetch(
      `https://api.football-data.org/v4/matches?dateFrom=${yesterday}&dateTo=${tomorrow}`,
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

    const teamFlags = {
      'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'Germany': '🇩🇪',
      'France': '🇫🇷', 'Spain': '🇪🇸', 'England': '🏴󠁧󠁥󠁧󠁿',
      'Italy': '🇮', 'Portugal': '🇹', 'Netherlands': '🇳🇱',
      'Belgium': '🇧🇪', 'Mexico': '🇲🇽', 'USA': '🇺🇸',
      'Canada': '🇨🇦', 'Japan': '🇯🇵', 'South Korea': '🇰🇷',
      'Saudi Arabia': '🇸🇦', 'Egypt': '🇪🇬', 'Morocco': '🇲',
      'Algeria': '🇩🇿', 'Tunisia': '🇹', 'Qatar': '🇦',
      'Iraq': '🇮', 'Jordan': '🇴', 'Australia': '🇦🇺',
      'Uruguay': '🇺🇾', 'Colombia': '🇨🇴', 'Croatia': '🇭🇷',
      'Ghana': '🇬🇭', 'Senegal': '🇸🇳', 'South Africa': '🇿🇦',
      'Sweden': '🇸', 'Switzerland': '🇨🇭', 'Austria': '🇦🇹',
      'Denmark': '🇩🇰', 'Norway': '🇳🇴', 'Turkey': '🇹🇷',
      'Iran': '🇮', 'Paraguay': '🇾', 'Ecuador': '🇪',
      'Czech Republic': '🇨', 'Scotland': '󠁧󠁳󠁿',
      'Bosnia and Herzegovina': '🇧🇦', 'Haiti': '🇭🇹',
      'Cape Verde': '🇨🇻', 'Curaçao': '🇨🇼',
      "Côte d'Ivoire": '🇨🇮', 'Congo DR': '🇨',
      'Uzbekistan': '🇺', 'Panama': '🇦', 'New Zealand': '🇳🇿'
    };

    let liveMatchesCount = 0;

    const matches = data.matches.map(match => {
      let status = 'upcoming';
      let statusText = 'قادمة';
      
      if (match.status === 'FINISHED') {
        status = 'finished';
        statusText = 'انتهت';
      } else if (['IN_PLAY', 'PAUSED', 'TIMED'].includes(match.status)) {
        status = 'live';
        statusText = '🔴 مباشر';
        liveMatchesCount++;
      }

      let score = '- : -';
      let minute = '';
      
      if (match.score.fullTime.home !== null) {
        score = `${match.score.fullTime.home} - ${match.score.fullTime.away}`;
      } else if (match.score.halfTime.home !== null) {
        score = `${match.score.halfTime.home} - ${match.score.halfTime.away} (شوط أول)`;
      }

      // إضافة الدقيقة للمباريات المباشرة
      if (status === 'live' && match.matchday) {
        minute = ` - الدقيقة ${match.matchday}'`;
      }

      const homeFlag = teamFlags[match.homeTeam.shortName] || '⚽';
      const awayFlag = teamFlags[match.awayTeam.shortName] || '⚽';

      return {
        group: match.competition.name,
        date: match.utcDate.split('T')[0],
        time: match.utcDate.split('T')[1].substring(0, 5),
        team1: `${homeFlag} ${match.homeTeam.shortName}`,
        team2: `${awayFlag} ${match.awayTeam.shortName}`,
        score: score,
        status: status,
        statusText: statusText,
        minute: minute,
        utcDate: match.utcDate,
        homeTeam: match.homeTeam.shortName,
        awayTeam: match.awayTeam.shortName,
        competition: match.competition.name
      };
    });

    matches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
    
    const outputData = {
      lastUpdate: new Date().toISOString(),
      liveMatchesCount: liveMatchesCount,
      matches: matches
    };

    fs.writeFileSync('matches.json', JSON.stringify(outputData, null, 2));
    console.log(`✅ تم حفظ ${matches.length} مباراة (${liveMatchesCount} مباشرة)`);

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

fetchMatches();
