// Shared i18n for every Count8 page (Learning Mode, Practice Journal).
// Plain script (not a module) so it can be dropped in with a single <script>
// tag before each page's own app.js, same pattern as shared/nav.css.
(() => {
  'use strict';

  const STORAGE_KEY = 'dancelens.lang';
  const DEFAULT_LANG = 'en';

  const TRANSLATIONS = {
    en: {
      analysis_timeout_error: 'This is taking too long and timed out — the connection to the AI service may be slow or blocked. Try again, or use a VPN if you\'re on a restricted network.',
      retry_btn: 'Retry',
      search_login_required_hint: 'This platform may require logging in to view search results.',

      nav_learning: 'Learning Mode',
      nav_journal: 'Practice Journal',
      nav_advisor: 'Content Advisor',

      // Hero / cover screen
      hero_subtitle: 'Your AI Dance Coach — From Scratch to Stage',
      hero_start_btn: 'Start Now',

      // Language-mismatch notice (AI content generated in a different
      // language than the one currently active)
      lang_mismatch_note: 'This was generated in {lang}.',
      lang_mismatch_regenerate_btn: 'Regenerate in {lang}',

      // Learning Mode — projects
      nav_my_projects: 'My Projects',
      projects_heading: 'Your Projects',
      projects_intro: "Start a new project for a choreography you're learning, or reopen one to keep tracking your progress.",
      projects_new_btn: '+ New Project',
      projects_empty: 'No projects yet — create one to get started.',
      project_item_meta: '{practiceCount} practice sessions · {foundationsCount} moves identified',
      back_to_projects: '← My Projects',
      new_project_modal_title: 'Name Your Project',
      new_project_name_label: 'Choreography name',
      new_project_name_placeholder: 'e.g. Butter Chorus',
      new_project_create_btn: 'Create Project',
      score_accuracy: 'Accuracy',
      score_timing: 'Timing',
      score_stability: 'Stability',

      // Growth Journal (Feature 5)
      growth_title: 'Growth Journal',
      growth_empty: 'Create a project in Learning Mode and upload a practice video to start seeing your growth here.',
      growth_stat_frequency: 'Practice Sessions',
      growth_stat_choreographies: 'Choreographies',
      growth_stat_foundations: 'Moves Learned',
      growth_trend_title: 'Score Trends Over Time',
      growth_foundations_title: 'Moves You\'ve Learned',
      growth_projects_title: 'Your Choreography Projects',
      detail_original_video: 'Original Choreography',
      detail_no_video: 'No video saved for this project.',
      detail_foundations_title: 'Identified Moves',
      detail_practice_sessions_title: 'Practice Sessions ({count})',
      detail_practice_video_label: 'Practice Attempt',
      detail_advisor_title: 'Content Advisor Suggestions',

      // Practice Journal sub-tabs
      tab_my_projects: 'My Projects',
      tab_my_plan: 'My Plan',
      tab_my_growth: 'My Growth',

      // My Plan
      plan_add_title: 'Add to Your Plan',
      plan_time_label: 'Time',
      plan_text_label: 'What will you work on?',
      plan_text_placeholder: 'e.g. Practice waacking arms for 30 min',
      plan_add_btn: 'Add to Plan',
      plan_week_title: 'Next 7 Days',
      plan_day_empty: 'No plans yet',
      plan_delete_aria: 'Delete this plan entry',

      // Growth trend time range
      trend_range_7: '1 Week',
      trend_range_14: '2 Weeks',
      trend_range_30: '1 Month',
      trend_range_180: '6 Months',
      trend_range_365: '1 Year',

      // Learning Mode — upload screen
      upload_another_video: 'Upload another video',
      upload_heading: 'Upload a dance video',
      upload_desc_html: 'Drop an MP4 or MOV file here, or choose one from your device.<br/>Count8 will generate a mirrored version automatically.',
      choose_video: 'Choose Video',
      upload_error_invalid: 'Please upload an MP4 or MOV video file.',

      // Mirrored generation status
      gen_generate_btn: 'Generate mirrored video for download',
      gen_status_generating: 'Generating mirrored video…',
      gen_status_ready: 'Mirrored video ready.',
      gen_status_live_no_export: "Live mirrored preview is ready (this browser can't export a mirrored file).",
      gen_status_live_export_failed: 'Live mirrored preview is ready (export failed in this browser).',
      gen_download_link: 'Download mirrored video (.webm)',

      // Toolbar / view toggles
      toolbar_single: 'Single',
      toolbar_sidebyside: 'Side-by-Side',
      toolbar_original: 'Original',
      toolbar_mirrored: 'Mirrored',
      toolbar_set_bpm: 'Set BPM',
      pane_original: 'Original',
      pane_mirrored: 'Mirrored',

      speed_title: 'Playback Speed',

      bookmark_loop_hint: 'Double-click (or long-press) the seek bar to drop a marker, then tap 🔁 to loop that section.',
      loop_btn_label: 'Loop this section',
      loop_btn_on: 'Looping ✓',

      // Identified moves
      foundations_title: 'Identified Moves',
      foundations_status_identifying: 'Identifying moves…',
      foundations_status_no_frames: "Couldn't read this video to analyze it. Try a different file.",
      tech_drill_title: 'Drill to Practice',
      tech_tutorials_title: 'Find Tutorials',

      // Practice feedback
      practice_feedback_title: 'Practice Feedback',
      practice_feedback_intro: 'Upload a video of yourself practicing this choreography to get personalized feedback on timing, posture, and technique.',
      practice_upload_btn: 'Upload Your Practice Video',
      practice_pane_reference: 'Original Choreography',
      practice_pane_practice: 'Your Practice',
      practice_align_btn: 'Set Align Point Here',
      practice_align_reset: 'Reset Align',
      practice_align_hint: "Both videos play together from the start by default. If your practice video doesn't start at the same moment, pause each on a matching beat and tap \"Set Align Point Here\" on both.",
      issue_jump_to_time: 'Jump to this moment in your practice video',
      timing_label_late: 'Late',
      timing_label_early: 'Rushed',
      practice_status_analyzing: 'Analyzing your practice video…',
      practice_status_no_frames: "Couldn't read one of these videos to analyze it. Try different files.",

      // BPM modal
      bpm_modal_title: 'Set BPM',
      bpm_manual_label: 'Manual entry',
      bpm_input_placeholder: 'e.g. 120',
      bpm_apply: 'Apply',
      bpm_or: 'or',
      bpm_tap_label: 'Tap tempo',
      bpm_tap_btn: 'TAP',
      bpm_detected: 'Detected:',
      bpm_unit: 'BPM',
      bpm_use_this: 'Use this BPM',
      bpm_align: 'Align beat 1 to current video time',
      bpm_align_hint: 'Pause the video on a downbeat, then tap this to sync counting.',
      bpm_aligned: 'Aligned ✓',
      bpm_close: 'Close',
      bpm_turn_off: 'Turn off beat overlay',
      bpm_voice_count_label: 'Voice count-out',
      bpm_voice_count_hint: 'Speaks each count (1-8) out loud as the beat overlay ticks, using your device\'s text-to-speech.',
      bpm_auto_label: 'Auto-detect from audio',
      bpm_auto_btn: 'Auto-Detect',
      bpm_auto_hint: 'Best-effort estimate from the video\'s audio track — double-check it against the music before relying on it.',
      bpm_auto_detecting: 'Detecting…',
      bpm_auto_no_audio: 'No usable audio track found in this video.',
      bpm_auto_no_beat: "Couldn't detect a clear beat — try tap tempo or manual entry instead.",
      bpm_auto_unsupported: 'Audio analysis isn\'t supported in this browser.',
      bpm_auto_failed: 'Could not analyze this video\'s audio.',

      // Practice Journal
      journal_log_title: 'Log a Practice Session',
      journal_date_label: 'Date',
      journal_technique_label: 'Technique',
      journal_technique_placeholder: 'e.g. Chest Isolations',
      journal_video_label: 'Video (file name or YouTube link)',
      journal_video_placeholder: 'e.g. practice_take3.mp4 or a YouTube URL',
      journal_rating_label: 'Self-Rating',
      journal_rating_error: 'Please select a rating.',
      journal_notes_label: 'Notes',
      journal_notes_placeholder: 'What felt good? What needs work?',
      journal_log_btn: 'Log Session',
      journal_next_up_title: 'What to Work On Next',
      journal_next_up_empty: "Log a few sessions and I'll tell you what to focus on next.",
      journal_next_up_detail: 'Averaging {avg}★ over your last {count} session{plural}. A few focused reps here will move the needle.',
      journal_charts_title: 'Progress Over Time',
      journal_charts_empty: 'Log a few sessions to see your progress chart.',
      journal_timeline_title: 'Practice Timeline',
      journal_timeline_empty: 'No sessions logged yet. Add your first one above!',
      journal_session_count: '{count} session{plural}',
      journal_delete_confirm: 'Delete this practice session? This cannot be undone.',
      journal_delete_aria: 'Delete this entry',

      journal_affirmation_1: 'Every rep is progress, even the messy ones.',
      journal_affirmation_2: 'Your body remembers what your mind is still learning.',
      journal_affirmation_3: 'Consistency beats intensity — show up again tomorrow.',
      journal_affirmation_4: 'That wobble today is the smoothness of next week.',
      journal_affirmation_5: "You're not behind. You're mid-process.",

      // Content Advisor
      advisor_heading: 'Social Media Performance Advisor',
      advisor_intro: 'Upload a reference dance video you want to recreate for social media. Count8 will analyze its filming style and suggest how to shoot your own version for TikTok, Instagram Reels, or Xiaohongshu.',
      advisor_upload_btn: 'Upload Reference Video',
      advisor_status_analyzing: 'Analyzing filming style…',
      advisor_status_no_frames: "Couldn't read this video for analysis. Try a different file.",
      advisor_pane_label: 'Reference Video',
      advisor_results_title: 'Filming & Styling Suggestions',
      advisor_project_label: 'Save results to project',
      advisor_project_none: "Don't save (standalone)",
      advisor_saved_note: 'Saved to project: {projectName}',
      advisor_choose_project_label: 'Use a video from My Projects',
      advisor_choose_project_placeholder: 'Select a project…',
      advisor_or: 'or',
      advisor_saved_videos_title: 'Previously analyzed videos',
      advisor_video_project_tag: 'From: {projectName}',
      advisor_remove_video: 'Remove',
      advisor_cached_note: 'Loaded from memory — no re-upload or re-analysis needed.',
      advisor_cat_outfit: 'Outfit Styling',
      advisor_cat_camera_angle: 'Camera Angle',
      advisor_cat_camera_distance: 'Camera Distance',
      advisor_cat_location: 'Filming Location',
      advisor_cat_lighting: 'Lighting',
      advisor_cat_background: 'Background',
      advisor_cat_filters: 'Filters & Color Grading',
      advisor_cat_framing: 'Video Framing',
    },
    zh: {
      analysis_timeout_error: '请求超时了 —— 到 AI 服务的连接可能比较慢或者被限制了。请重试，如果你的网络访问受限，也可以尝试使用 VPN。',
      retry_btn: '重试',
      search_login_required_hint: '该平台的搜索结果可能需要登录才能查看。',

      nav_learning: '学习模式',
      nav_journal: '训练日志',
      nav_advisor: '内容顾问',

      hero_subtitle: '你的 AI 舞蹈教练 — 从零基础到舞台高光',
      hero_start_btn: '立即开始',

      lang_mismatch_note: '此内容是用{lang}生成的。',
      lang_mismatch_regenerate_btn: '用{lang}重新生成',

      nav_my_projects: '我的项目',
      projects_heading: '你的项目',
      projects_intro: '为你正在学习的一段编舞创建一个新项目，或者重新打开一个项目继续跟踪你的进度。',
      projects_new_btn: '+ 新建项目',
      projects_empty: '还没有项目 — 创建一个开始吧。',
      project_item_meta: '{practiceCount} 次练习 · 识别出 {foundationsCount} 个招式',
      back_to_projects: '← 我的项目',
      new_project_modal_title: '为项目命名',
      new_project_name_label: '编舞名称',
      new_project_name_placeholder: '例如：Butter 副歌部分',
      new_project_create_btn: '创建项目',
      score_accuracy: '准确度',
      score_timing: '节奏感',
      score_stability: '稳定性',

      growth_title: '成长日志',
      growth_empty: '在学习模式中创建一个项目并上传练习视频，即可在这里查看你的成长记录。',
      growth_stat_frequency: '练习次数',
      growth_stat_choreographies: '编舞项目',
      growth_stat_foundations: '学会的招式',
      growth_trend_title: '成绩变化趋势',
      growth_foundations_title: '已学会的招式',
      growth_projects_title: '你的编舞项目',
      detail_original_video: '原始编舞视频',
      detail_no_video: '该项目没有保存视频。',
      detail_foundations_title: '识别到的招式',
      detail_practice_sessions_title: '练习记录（{count} 次）',
      detail_practice_video_label: '练习视频',
      detail_advisor_title: '内容顾问建议',

      tab_my_projects: '我的项目',
      tab_my_plan: '我的计划',
      tab_my_growth: '我的成长',

      plan_add_title: '添加计划',
      plan_time_label: '时间',
      plan_text_label: '你打算做什么？',
      plan_text_placeholder: '例如：练习 waacking 手臂动作 30 分钟',
      plan_add_btn: '添加到计划',
      plan_week_title: '未来七天',
      plan_day_empty: '还没有安排',
      plan_delete_aria: '删除这条计划',

      trend_range_7: '一周',
      trend_range_14: '两周',
      trend_range_30: '一个月',
      trend_range_180: '半年',
      trend_range_365: '一年',

      upload_another_video: '上传另一个视频',
      upload_heading: '上传一段舞蹈视频',
      upload_desc_html: '将 MP4 或 MOV 文件拖到这里，或从设备中选择一个文件。<br/>Count8 会自动生成镜像版本。',
      choose_video: '选择视频',
      upload_error_invalid: '请上传 MP4 或 MOV 格式的视频文件。',

      gen_generate_btn: '生成可下载的镜像视频',
      gen_status_generating: '正在生成镜像视频…',
      gen_status_ready: '镜像视频已生成。',
      gen_status_live_no_export: '实时镜像预览已就绪（此浏览器无法导出镜像视频文件）。',
      gen_status_live_export_failed: '实时镜像预览已就绪（此浏览器导出失败）。',
      gen_download_link: '下载镜像视频 (.webm)',

      toolbar_single: '单画面',
      toolbar_sidebyside: '并排显示',
      toolbar_original: '原始视频',
      toolbar_mirrored: '镜像视频',
      toolbar_set_bpm: '设置 BPM',
      pane_original: '原始视频',
      pane_mirrored: '镜像视频',

      speed_title: '播放速度',

      bookmark_loop_hint: '双击（或长按）进度条添加节点，然后点击 🔁 循环播放该片段。',
      loop_btn_label: '循环播放该片段',
      loop_btn_on: '循环中 ✓',

      foundations_title: '招式识别',
      foundations_status_identifying: '正在识别招式…',
      foundations_status_no_frames: '无法读取该视频进行分析，请换一个文件试试。',
      tech_drill_title: '练习动作',
      tech_tutorials_title: '查找教程',

      practice_feedback_title: '练习反馈',
      practice_feedback_intro: '上传一段你练习这套编舞的视频，获取关于节奏、姿态和技巧的个性化反馈。',
      practice_upload_btn: '上传你的练习视频',
      practice_pane_reference: '原始编舞',
      practice_pane_practice: '你的练习',
      practice_align_btn: '在此设置对齐点',
      practice_align_reset: '重置对齐',
      practice_align_hint: '默认两段视频从头开始一起播放。如果你的练习视频开始的时间点对不上，可以分别把两段视频暂停在同一个节拍上，再点"在此设置对齐点"。',
      issue_jump_to_time: '跳转到练习视频的这个时刻',
      timing_label_late: '慢',
      timing_label_early: '抢拍',
      practice_status_analyzing: '正在分析你的练习视频…',
      practice_status_no_frames: '无法读取其中一段视频进行分析，请换一个文件试试。',

      bpm_modal_title: '设置 BPM',
      bpm_manual_label: '手动输入',
      bpm_input_placeholder: '例如 120',
      bpm_apply: '应用',
      bpm_or: '或',
      bpm_tap_label: '点按测速',
      bpm_tap_btn: '点击',
      bpm_detected: '检测到：',
      bpm_unit: 'BPM',
      bpm_use_this: '使用此 BPM',
      bpm_align: '将第 1 拍对齐到当前视频时间',
      bpm_align_hint: '在强拍处暂停视频，然后点击此按钮同步节拍计数。',
      bpm_aligned: '已对齐 ✓',
      bpm_close: '关闭',
      bpm_turn_off: '关闭节拍显示',
      bpm_voice_count_label: '语音喊拍',
      bpm_voice_count_hint: '节拍跳动时，用你设备的语音朗读功能喊出每个拍数（1-8）。',
      bpm_auto_label: '从音频自动识别',
      bpm_auto_btn: '自动识别',
      bpm_auto_hint: '这是根据视频音轨估算的结果，请对照音乐核实一下再使用。',
      bpm_auto_detecting: '识别中…',
      bpm_auto_no_audio: '这个视频里没有可用的音轨。',
      bpm_auto_no_beat: '没能识别出明显的节拍，请改用点按测速或手动输入。',
      bpm_auto_unsupported: '当前浏览器不支持音频分析。',
      bpm_auto_failed: '无法分析这个视频的音频。',

      journal_log_title: '记录一次练习',
      journal_date_label: '日期',
      journal_technique_label: '技巧',
      journal_technique_placeholder: '例如：胸部分离',
      journal_video_label: '视频（文件名或 YouTube 链接）',
      journal_video_placeholder: '例如 practice_take3.mp4 或一个 YouTube 链接',
      journal_rating_label: '自我评分',
      journal_rating_error: '请选择一个评分。',
      journal_notes_label: '笔记',
      journal_notes_placeholder: '哪里感觉不错？哪里还需要改进？',
      journal_log_btn: '记录这次练习',
      journal_next_up_title: '接下来该练什么',
      journal_next_up_empty: '记录几次练习后，我会告诉你接下来该重点练什么。',
      journal_next_up_detail: '最近 {count} 次练习平均 {avg}★。多花点时间专项练习会有明显提升。',
      journal_charts_title: '进步曲线',
      journal_charts_empty: '记录几次练习后即可查看你的进步曲线。',
      journal_timeline_title: '练习时间线',
      journal_timeline_empty: '还没有记录任何练习，去上面添加你的第一条记录吧！',
      journal_session_count: '{count} 次练习',
      journal_delete_confirm: '删除这条练习记录？此操作无法撤销。',
      journal_delete_aria: '删除此记录',

      journal_affirmation_1: '每一次重复都是进步，哪怕跳得不完美。',
      journal_affirmation_2: '身体会记住，心里还在学的东西。',
      journal_affirmation_3: '坚持比拼命更重要——明天继续来。',
      journal_affirmation_4: '今天的晃动，是下周的稳当。',
      journal_affirmation_5: '你没有落后，你只是还在过程中。',

      // Content Advisor
      advisor_heading: '社交媒体内容顾问',
      advisor_intro: '上传一段你想模仿拍摄的舞蹈参考视频，Count8 会分析它的拍摄风格，并给出如何为 TikTok、Instagram Reels 或小红书拍摄你自己版本的建议。',
      advisor_upload_btn: '上传参考视频',
      advisor_status_analyzing: '正在分析拍摄风格…',
      advisor_status_no_frames: '无法读取该视频进行分析，请尝试其他文件。',
      advisor_pane_label: '参考视频',
      advisor_results_title: '拍摄与风格建议',
      advisor_project_label: '将结果保存到项目',
      advisor_project_none: '不保存（独立使用）',
      advisor_saved_note: '已保存到项目：{projectName}',
      advisor_choose_project_label: '从我的项目中选择视频',
      advisor_choose_project_placeholder: '选择一个项目…',
      advisor_or: '或',
      advisor_saved_videos_title: '之前分析过的视频',
      advisor_video_project_tag: '来自：{projectName}',
      advisor_remove_video: '移除',
      advisor_cached_note: '已从记忆中加载，无需重新上传或重新分析。',
      advisor_cat_outfit: '服装造型',
      advisor_cat_camera_angle: '拍摄角度',
      advisor_cat_camera_distance: '拍摄距离',
      advisor_cat_location: '拍摄地点',
      advisor_cat_lighting: '灯光',
      advisor_cat_background: '背景',
      advisor_cat_filters: '滤镜与调色',
      advisor_cat_framing: '画面构图',
    },
  };

  function getLang() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'zh') return stored;
    } catch (e) { /* localStorage unavailable, fall through to default */ }
    return DEFAULT_LANG;
  }

  let currentLang = getLang();
  const changeListeners = [];

  function t(key, vars) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS[DEFAULT_LANG];
    let str = dict[key];
    if (str === undefined) str = TRANSLATIONS[DEFAULT_LANG][key];
    if (str === undefined) return key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      });
    }
    return str;
  }

  function applyStaticTranslations(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    scope.querySelectorAll('[data-i18n-html]').forEach((el) => {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    scope.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
  }

  function setLang(lang) {
    if (lang !== 'en' && lang !== 'zh') return;
    currentLang = lang;
    try { window.localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
    applyStaticTranslations();
    updateSwitcherActiveState();
    changeListeners.forEach((cb) => {
      try { cb(lang); } catch (e) { console.error('i18n change listener failed', e); }
    });
  }

  function onChange(cb) {
    changeListeners.push(cb);
  }

  function updateSwitcherActiveState() {
    document.querySelectorAll('.lang-switch [data-lang]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
    });
  }

  function buildSwitcher() {
    const wrap = document.createElement('div');
    wrap.className = 'lang-switch';
    wrap.setAttribute('role', 'tablist');
    wrap.setAttribute('aria-label', 'Language');

    ['en', 'zh'].forEach((lang) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.lang = lang;
      btn.textContent = lang === 'en' ? 'EN' : '中文';
      btn.addEventListener('click', () => setLang(lang));
      wrap.appendChild(btn);
    });

    return wrap;
  }

  function mountSwitcher() {
    const mount = document.getElementById('langSwitchMount');
    if (!mount) return;
    mount.appendChild(buildSwitcher());
    updateSwitcherActiveState();
  }

  function init() {
    mountSwitcher();
    applyStaticTranslations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.DanceLensI18n = { t, getLang, setLang, onChange, applyStaticTranslations };
})();
