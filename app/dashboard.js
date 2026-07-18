fetch('dashboard_data.json?nocache=' + Date.now())
  .then(function(response) { return response.json(); })
  .then(function(companies) {

    document.getElementById('total-companies').textContent = companies.length;
    var total = companies.reduce(function(sum, c) { return sum + (c.overall_score || 0); }, 0);
    document.getElementById('avg-score').textContent = (total / companies.length).toFixed(1);
    document.getElementById('top-company').textContent = companies[0] ? companies[0].company_name : '--';

    var grid = document.getElementById('company-grid');

    companies.forEach(function(c) {
      var scores = c.scores || {};
      var rg = scores.revenue_growth || {};
      var fs = scores.financial_strength || {};

      function badgeClass(score) {
        if (!score && score !== 0) return 'score-red';
        if (score >= 70) return 'score-green';
        if (score >= 40) return 'score-yellow';
        return 'score-red';
      }

      var card = document.createElement('div');
      card.className = 'company-card';
      card.draggable = true;

      card.innerHTML =
        '<div class="company-name">' + (c.company_name || c.ticker) + '</div>' +
        '<div class="ticker">' + c.ticker + '</div>' +
        '<div class="overall-score">' +
          '<p>Overall Score</p>' +
          '<h2>' + (c.overall_score !== null ? c.overall_score : '--') + '</h2>' +
        '</div>' +
        '<div class="score-section">' +
          '<div class="score-row">' +
            '<span class="score-title">Revenue Growth</span>' +
            '<span class="score-value ' + badgeClass(rg.score) + '">' + (rg.score !== null && rg.score !== undefined ? rg.score : '--') + '</span>' +
          '</div>' +
          '<div class="explanation">' + (rg.explanation || 'No data available.') + '</div>' +
        '</div>' +
        '<div class="score-section">' +
          '<div class="score-row">' +
            '<span class="score-title">Financial Strength</span>' +
            '<span class="score-value ' + badgeClass(fs.score) + '">' + (fs.score !== null && fs.score !== undefined ? fs.score : '--') + '</span>' +
          '</div>' +
          '<div class="explanation">' + (fs.explanation || 'No data available.') + '</div>' +
        '</div>';

      grid.appendChild(card);
    });

    // Drag and drop
    var dragSrc = null;

    function handleDragStart(e) {
      dragSrc = this;
      this.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      this.classList.add('drag-over');
    }

    function handleDragLeave() {
      this.classList.remove('drag-over');
    }

    function handleDrop(e) {
      e.preventDefault();
      this.classList.remove('drag-over');
      if (dragSrc !== this) {
        var parent = this.parentNode;
        var srcNext = dragSrc.nextSibling;
        var targetNext = this.nextSibling;
        parent.insertBefore(dragSrc, targetNext);
        parent.insertBefore(this, srcNext);
      }
    }

    function handleDragEnd() {
      this.classList.remove('dragging');
      document.querySelectorAll('.company-card').forEach(function(c) {
        c.classList.remove('drag-over');
      });
    }

    document.querySelectorAll('.company-card').forEach(function(card) {
      card.addEventListener('dragstart', handleDragStart);
      card.addEventListener('dragover', handleDragOver);
      card.addEventListener('dragleave', handleDragLeave);
      card.addEventListener('drop', handleDrop);
      card.addEventListener('dragend', handleDragEnd);
    });

  })
  .catch(function(error) {
    document.getElementById('company-grid').innerHTML =
      '<p style="color:#f87171;padding:20px">Error loading data: ' + error + '</p>';
  });