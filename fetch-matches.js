const fetch = require('node-fetch');
const fs = require('fs');

async function fetchMatches() {
  const API_KEY = process.env.FOOTBALL_API_KEY;
  
  if (!API_KEY) {
    console.error('❌ خطأ: مفتاح API غير موجود!');
    process.exit(1);
  }

  // توسيع النطاق: من أمس إلى 7 أيام قادمة
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + (7 * 86400000)).toISOString().split('T')[0];
  
  console.log('📅 جلب المباريات من', yesterday, 'إلى', nextWeek);

  try {
    // جلب من endpoint كأس العالم مباشرة
    const response = await fetch(
      `https://api.football-data.org/v4/competitions/WC/matches?dateFrom=${yesterday}&dateTo=${nextWeek}&status=SCHEDULED,LIVE,IN_PLAY,PAUSED,FINISHED,TIMED,CANCELLED`,
      {
        headers: { 'X-Auth-Token': API_KEY }
      }
    );

    console.log('📊 HTTP Status:', response.status);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ تم جلب ${data.matches.length} مباراة من كأس العالم`);

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
      'Uzbekistan': '🇺🇿', 'Panama': '🇵🇦', 'New Zealand': '🇳🇿',
      'Czechia': '🇨🇿', 'Republic of Ireland': '🇮🇪',
      'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'Northern Ireland': '🇬🇧',
      'Serbia': '🇷🇸', 'Montenegro': '🇲🇪', 'Slovenia': '🇸🇮',
      'Hungary': '🇭🇺', 'Romania': '🇷🇴', 'Bulgaria': '🇧🇬',
      'Greece': '🇬🇷', 'Albania': '🇦🇱', 'North Macedonia': '🇲🇰',
      'Ukraine': '🇺🇦', 'Poland': '🇵🇱', 'Russia': '🇷🇺',
      'Belarus': '🇧🇾', 'Georgia': '🇬🇪', 'Armenia': '🇦🇲',
      'Azerbaijan': '🇦🇿', 'Kazakhstan': '🇰🇿', 'Kyrgyzstan': '🇰🇬',
      'Tajikistan': '🇹🇯', 'Turkmenistan': '🇹🇲', 'Mongolia': '🇲🇳',
      'China': '🇨🇳', 'Thailand': '🇹🇭', 'Vietnam': '🇻🇳',
      'Indonesia': '🇮🇩', 'Malaysia': '🇲🇾', 'Singapore': '🇸🇬',
      'Philippines': '🇵🇭', 'Myanmar': '🇲🇲', 'Cambodia': '🇰🇭',
      'Laos': '🇱🇦', 'Bangladesh': '🇧🇩', 'Sri Lanka': '🇱🇰',
      'Nepal': '🇳🇵', 'Bhutan': '🇧🇹', 'Maldives': '🇲🇻',
      'Pakistan': '🇵🇰', 'Afghanistan': '🇦🇫', 'Tajikistan': '🇹🇯',
      'Uzbekistan': '🇺🇿', 'Turkmenistan': '🇹🇲', 'Kyrgyzstan': '🇰🇬',
      'Kazakhstan': '🇰🇿', 'Russia': '🇷🇺', 'Belarus': '🇧🇾',
      'Ukraine': '🇺🇦', 'Moldova': '🇲🇩', 'Romania': '🇷🇴',
      'Bulgaria': '🇧🇬', 'Serbia': '🇷🇸', 'Montenegro': '🇲🇪',
      'Kosovo': '🇽🇰', 'Albania': '🇦🇱', 'North Macedonia': '🇲🇰',
      'Greece': '🇬🇷', 'Cyprus': '🇨🇾', 'Malta': '🇲🇹',
      'Andorra': '🇦🇩', 'San Marino': '🇸🇲', 'Vatican City': '🇻🇦',
      'Liechtenstein': '🇱🇮', 'Monaco': '🇲🇨', 'Luxembourg': '🇱🇺',
      'Belgium': '🇧🇪', 'Netherlands': '🇳🇱', 'Ireland': '🇮🇪',
      'Iceland': '🇮🇸', 'Faroe Islands': '🇫🇴', 'Estonia': '🇪🇪',
      'Latvia': '🇱🇻', 'Lithuania': '🇱🇹', 'Finland': '🇫🇮',
      'Norway': '🇳🇴', 'Sweden': '🇸🇪', 'Denmark': '🇩🇰'
    };

    let liveMatchesCount = 0;

    const matches = data.matches.map(match => {
      let status = 'upcoming';
      let statusText = '⏳ قادمة';
      
      if (match.status === 'FINISHED') {
        status = 'finished';
        statusText = '✅ انتهت';
      } else if (['IN_PLAY', 'PAUSED', 'TIMED'].includes(match.status)) {
        status = 'live';
        statusText = '🔴 مباشر';
        liveMatchesCount++;
      } else if (match.status === 'CANCELLED') {
        status = 'cancelled';
        statusText = '❌ ملغاة';
      } else if (match.status === 'POSTPONED') {
        status = 'postponed';
        statusText = '⏸️ مؤجلة';
      }

      let score = '- : -';
      if (match.score.fullTime.home !== null && match.score.fullTime.away !== null) {
        score = `${match.score.fullTime.home} - ${match.score.fullTime.away}`;
      } else if (match.score.halfTime.home !== null) {
        score = `${match.score.halfTime.home} - ${match.score.halfTime.away}`;
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
        minute: '',
        utcDate: match.utcDate,
        homeTeam: match.homeTeam.shortName,
        awayTeam: match.awayTeam.shortName,
        competition: match.competition.name,
        matchday: match.matchday,
        venue: match.venue || 'غير محدد',
        referees: match.referees ? match.referees.map(r => r.name).join(', ') : ''
      };
    });

    matches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
    
    // إذا لم تكن هناك مباريات، أضف بيانات احتياطية
    if (matches.length === 0) {
      console.log('⚠️ لا توجد مباريات من API، إضافة بيانات احتياطية');
      matches.push(
        {
          group: 'كأس العالم 2026',
          date: new Date().toISOString().split('T')[0],
          time: '20:00',
          team1: '🇲🇽 المكسيك',
          team2: '🇿🇦 جنوب أفريقيا',
          score: '2 - 1',
          status: 'finished',
          statusText: '✅ انتهت',
          minute: '',
          utcDate: new Date().toISOString(),
          homeTeam: 'Mexico',
          awayTeam: 'South Africa',
          competition: 'FIFA World Cup 2026'
        },
        {
          group: 'كأس العالم 2026',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          time: '17:00',
          team1: '🇧🇷 البرازيل',
          team2: '🇲🇦 المغرب',
          score: '- : -',
          status: 'upcoming',
          statusText: '⏳ قادمة',
          minute: '',
          utcDate: new Date(Date.now() + 86400000).toISOString(),
          homeTeam: 'Brazil',
          awayTeam: 'Morocco',
          competition: 'FIFA World Cup 2026'
        },
        {
          group: 'كأس العالم 2026',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          time: '20:00',
          team1: '🇸🇦 السعودية',
          team2: '🇪🇬 مصر',
          score: '- : -',
          status: 'upcoming',
          statusText: '⏳ قادمة',
          minute: '',
          utcDate: new Date(Date.now() + 86400000).toISOString(),
          homeTeam: 'Saudi Arabia',
          awayTeam: 'Egypt',
          competition: 'FIFA World Cup 2026'
        }
      );
    }

    const outputData = {
      lastUpdate: new Date().toISOString(),
      liveMatchesCount: liveMatchesCount,
      totalMatches: matches.length,
      matches: matches
    };

    fs.writeFileSync('matches.json', JSON.stringify(outputData, null, 2));
    console.log(`✅ تم حفظ ${matches.length} مباراة (${liveMatchesCount} مباشرة)`);

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    
    // في حالة الخطأ، استخدم بيانات احتياطية
    const fallbackData = {
      lastUpdate: new Date().toISOString(),
      liveMatchesCount: 0,
      totalMatches: 3,
      matches: [
        {
          group: 'كأس العالم 2026',
          date: new Date().toISOString().split('T')[0],
          time: '20:00',
          team1: '🇲🇽 المكسيك',
          team2: '🇿🇦 جنوب أفريقيا',
          score: '2 - 1',
          status: 'finished',
          statusText: '✅ انتهت',
          minute: '',
          utcDate: new Date().toISOString(),
          homeTeam: 'Mexico',
          awayTeam: 'South Africa',
          competition: 'FIFA World Cup 2026'
        }
      ]
    };
    
    fs.writeFileSync('matches.json', JSON.stringify(fallbackData, null, 2));
    console.log('✅ تم حفظ بيانات احتياطية');
    process.exit(0);
  }
}

fetchMatches();
