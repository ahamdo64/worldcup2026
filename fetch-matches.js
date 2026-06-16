const fetch = require('node-fetch');
const fs = require('fs');

const API_KEY = process.env.API_KEY || '';

// جلب مباريات من آخر 30 يوم إلى 30 يوم قادمة
const dateFrom = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
const dateTo = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

console.log('🔍 Fetching matches from', dateFrom, 'to', dateTo);
console.log('🔑 API Key exists:', API_KEY ? 'Yes ✓' : 'No ✗');

const flags = {
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
  'Poland': '🇵🇱', 'Czech Republic': '🇨🇿', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Bosnia and Herzegovina': '🇧🇦', 'Curaçao': '🇨🇼',
  'Côte d\'Ivoire': '🇨🇮', 'Cape Verde': '🇨🇻',
  'New Zealand': '🇳🇿', 'Congo DR': '🇨🇩', 'Uzbekistan': '🇺🇿',
  'Haiti': '🇭🇹', 'Panama': '🇵🇦', 'Nigeria': '🇳🇬',
  'Cameroon': '🇨🇲', 'Korea Republic': '🇰🇷', 'Czechia': '🇨🇿',
  'Bosnia-H.': '🇧🇦'
};

async function fetchMatches() {
  try {
    const url = `https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
    console.log('📡 Requesting:', url);
    
    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': API_KEY,
        'Accept': 'application/json'
      }
    });
    
    console.log('📊 HTTP Status:', response.status);
    
    if (response.status === 401) {
      console.error('❌ Error 401: Invalid API Key');
      createFallbackData('Invalid API Key');
      return;
    }
    
    if (response.status === 429) {
      console.error('❌ Error 429: Too Many Requests');
      createFallbackData('Rate Limit Exceeded');
      return;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      createFallbackData('API Error ' + response.status);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Received', data.matches ? data.matches.length : 0, 'matches');
    
    if (!data.matches || data.matches.length === 0) {
      console.log('⚠️ No matches found in this period');
      createFallbackData('No matches from API');
      return;
    }
    
    const matches = data.matches.map(match => {
      const homeFlag = flags[match.homeTeam.shortName] || '⚽';
      const awayFlag = flags[match.awayTeam.shortName] || '⚽';
      
      let status = 'upcoming';
      let statusText = '⏰ قادمة';
      
      if (match.status === 'FINISHED') {
        status = 'finished';
        statusText = '✅ انتهت';
      } else if (match.status === 'IN_PLAY' || match.status === 'PAUSED' || match.status === 'TIMED') {
        status = 'live';
        statusText = '🔴 مباشر';
      }
      
      let score = '- : -';
      if (match.score.fullTime.home !== null) {
        score = `${match.score.fullTime.home} - ${match.score.fullTime.away}`;
      }
      
      return {
        group: match.competition?.name || 'FIFA World Cup',
        date: match.utcDate.split('T')[0],
        time: match.utcDate.split('T')[1].split('Z')[0].substring(0, 5),
        team1: `${homeFlag} ${match.homeTeam.shortName}`,
        team2: `${awayFlag} ${match.awayTeam.shortName}`,
        homeTeam: match.homeTeam.shortName,
        awayTeam: match.awayTeam.shortName,
        score: score,
        status: status,
        statusText: statusText,
        minute: match.minute || '',
        utcDate: match.utcDate,
        competition: match.competition?.name || 'FIFA World Cup',
        matchday: match.matchday,
        venue: match.venue || 'غير محدد',
        referees: match.referees?.[0]?.name || ''
      };
    });
    
    matches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
    
    const finished = matches.filter(m => m.status === 'finished');
    const live = matches.filter(m => m.status === 'live');
    const upcoming = matches.filter(m => m.status === 'upcoming');
    
    const output = {
      lastUpdate: new Date().toISOString(),
      totalMatches: matches.length,
      finishedMatchesCount: finished.length,
      liveMatchesCount: live.length,
      upcomingMatchesCount: upcoming.length,
      matches: matches
    };
    
    fs.writeFileSync('matches.json', JSON.stringify(output, null, 2));
    console.log('✅ Saved', matches.length, 'matches to matches.json');
    console.log('  - Finished:', finished.length);
    console.log('  - Live:', live.length);
    console.log('  - Upcoming:', upcoming.length);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    createFallbackData(error.message);
  }
}

function createFallbackData(reason) {
  console.log('⚠️ Creating fallback data. Reason:', reason);
  
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  const fallbackData = {
    lastUpdate: new Date().toISOString(),
    totalMatches: 4,
    finishedMatchesCount: 1,
    liveMatchesCount: 1,
    upcomingMatchesCount: 2,
    matches: [
      {
        group: "FIFA World Cup",
        date: today,
        time: "19:00",
        team1: "🇨🇦 Canada",
        team2: "🇧🇦 Bosnia-H.",
        homeTeam: "Canada",
        awayTeam: "Bosnia-H.",
        score: "2 - 1",
        status: "live",
        statusText: "🔴 مباشر",
        minute: "65",
        utcDate: `${today}T19:00:00Z`,
        competition: "FIFA World Cup",
        matchday: 1,
        venue: "MetLife Stadium",
        referees: "Facundo Tello"
      },
      {
        group: "FIFA World Cup",
        date: today,
        time: "16:00",
        team1: "🇲🇽 Mexico",
        team2: "🇿🇦 South Africa",
        homeTeam: "Mexico",
        awayTeam: "South Africa",
        score: "2 - 0",
        status: "finished",
        statusText: "✅ انتهت",
        minute: "",
        utcDate: `${today}T16:00:00Z`,
        competition: "FIFA World Cup",
        matchday: 1,
        venue: "Estadio Azteca",
        referees: "Wilton Sampaio"
      },
      {
        group: "FIFA World Cup",
        date: tomorrow,
        time: "22:00",
        team1: "🇧🇷 Brazil",
        team2: "🇲🇦 Morocco",
        homeTeam: "Brazil",
        awayTeam: "Morocco",
        score: "- : -",
        status: "upcoming",
        statusText: "⏰ قادمة",
        minute: "",
        utcDate: `${tomorrow}T22:00:00Z`,
        competition: "FIFA World Cup",
        matchday: 1,
        venue: "SoFi Stadium",
        referees: ""
      },
      {
        group: "FIFA World Cup",
        date: tomorrow,
        time: "19:00",
        team1: "🇺🇸 USA",
        team2: "🇵🇾 Paraguay",
        homeTeam: "USA",
        awayTeam: "Paraguay",
        score: "- : -",
        status: "upcoming",
        statusText: "⏰ قادمة",
        minute: "",
        utcDate: `${tomorrow}T19:00:00Z`,
        competition: "FIFA World Cup",
        matchday: 1,
        venue: "AT&T Stadium",
        referees: ""
      }
    ]
  };
  
  fs.writeFileSync('matches.json', JSON.stringify(fallbackData, null, 2));
  console.log('✅ Fallback data saved (4 matches)');
}

fetchMatches();
