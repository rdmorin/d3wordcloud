HTMLWidgets.widget({

  name: 'd3wordcloud',

  type: 'output',

  initialize: function(el, width, height) {

    var w = el.offsetWidth;
    var h = el.offsetHeight;

    var cloud = d3.layout.cloud();
    var svg = d3.select(el).append("svg").attr("width", w).attr("height", h);
    var background = svg.append("g");
    var vis = svg.append("g").attr("transform", "translate(" + [w >> 1, h >> 1] + ")");

    return {
      cloud: cloud,
      svg: svg,
      background: background,
      vis: vis
    };

  },

  renderValue: function(el, x, instance) {

    console.log(x.pars);
    console.log(x.data);

    var data = HTMLWidgets.dataframeToD3(x.data);

    var w = el.offsetWidth;
    var h = el.offsetHeight;

    d3.select("head")
      .append("link")
      .attr("href", "https://fonts.googleapis.com/css?family=" + x.pars.font)
      .attr("rel", "stylesheet");

    var sizescale;
    switch (x.pars.sizescale) {
        case "log":
            sizescale = d3.scale.log();
            break;
        case "sqrt":
            sizescale = d3.scale.sqrt();
            break;
        case "linear":
            sizescale = d3.scale.linear();
            break;
        default:
            sizescale = d3.scale.log();
    }

    var sizescale = sizescale
      .domain([d3.min(data, function(d) { return d.size; }),
               d3.max(data, function(d) { return d.size; })])
      .range(x.pars.rangesizefont);

    var colorscale;
    switch (x.pars.colorscale) {
        case "log":
            colorscale = d3.scale.log();
            break;
        case "sqrt":
            colorscale = d3.scale.sqrt();
            break;
        case "linear":
            colorscale = d3.scale.linear();
            break;
        default:
            colorscale = d3.scale.log();
    }

    if(!x.pars.missing_colors){
      if(x.pars.every_word_has_own_color){
        colorscale = d3.scale.ordinal()
          .domain(x.data.text)
          .range(x.data.color);

      } else {

        minsize = d3.min(data, function(d) { return d.size; });
        maxsize = d3.max(data, function(d) { return d.size; });

        colorscale = colorscale
          .domain(d3.range(minsize, maxsize, (maxsize-minsize)/x.pars.colors.length))
          .range(x.pars.colors);

      }

    } else {

      colorscale = d3.scale.category20b();

    }

    var spiral;
    switch (x.pars.spiral) {
        case "rectangular":
            spiral = "rectangular";
            break;
        case "archimedean":
            spiral = "archimedean";
            break;
        default:
            spiral = "archimedean";
    }

    instance.cloud
      .size([w, h])
      .words(data)
      .padding(x.pars.padding)
      .rotate(function() { return Math.floor(Math.random() * (x.pars.rotmax - x.pars.rotmin)) + x.pars.rotmin; })
      .font(x.pars.font)
      .fontSize(function(d) { return sizescale(d.size); })
      .spiral(spiral)
      .on("end", draw)
      .start();

    function draw(words) {
      var text = instance.vis.selectAll("text")
        .data(words, function(d) { return d.text.toLowerCase(); });

      text.transition()
        .duration(1000)
        .attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
        .style("font-size", function(d) { return d.size + "px"; });

      text.enter().append("text")
        .attr("text-anchor", "middle")
        .attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
        .style("font-size", "1px")
        .transition()
        .duration(1000)
        .style("font-size", function(d) { return d.size + "px"; });

      text.style("font-family", x.pars.font)
        .style("fill", function(d) { return colorscale(d.size); })
        .attr("data-toggle", "tooltip")
        .text(function(d) { return d.text; });

      var exitGroup = instance.background.append("g")
        .attr("transform", instance.vis.attr("transform"));

      var exitGroupNode = exitGroup.node();

      text.exit().each(function() {
        exitGroupNode.appendChild(this);
      });

      exitGroup.transition()
        .duration(1000)
        .style("opacity", 1e-6)
        .remove();

      instance.vis.transition()
        .delay(1000)
        .duration(750)
        .attr("transform", "translate(" + [w >> 1, h >> 1] + ")scale(" + 1 + ")");

      if(x.pars.tooltip) {
          var tooltip = d3.select("body")
            .append("div")
            .attr("class", "d3wordcloud-tooltip")
            .style("font-family", x.pars.font)
            .style("position", "absolute")
            .style("position", "absolute")
            .style("text-align", "right")
            .style("background", "#333")
            .style("margin", "3px")
            .style("color","white")
            .style("padding","3px")
            .style("border","0px")
            .style("border-radius","3px") // 3px rule
            .style("opacity",0)
            .style("cursor", "default");

          text
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .on("mousemove", mousemove);

          function mouseover(d){
            tooltip.transition().duration(100).style("opacity", 1);
            txt = (d.label === null) ? d.text + ": " + d.freq: d.label + ": " + d.freq;
            console.log(d);
            tooltip.html(txt);

          }

          function mouseout(d){
            tooltip.transition().duration(100).style("opacity", 0);
            d3.select("#" + idcontainer).selectAll("text").transition().duration(100).style("opacity", 1);

          }
          function mousemove(d){
            tooltip
              .style("left", (d3.event.pageX + 0 ) + "px")
              .style("top", (d3.event.pageY + - 70) + "px");

          }

      }

    }

  },

  resize: function(el, width, height, instance) {

  }

});
