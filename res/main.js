function message(msg) {
  $('#message').html(msg);
}

function organize(apiKey) {
  $('#items tbody').empty();
  $('#items tbody').html('<tr><td class="cost">Pending...</td></tr>');
  $('#items').show();
  $('#crafts tbody').empty();
  $('#crafts tbody').html('<tr><td class="cost">Pending...</td></tr>');
  $('#crafts').show();
  $('#tips tbody').empty();
  $('#tips tbody').html('<tr><td class="cost">Pending...</td></tr>');
  $('#tips').show();
  $('#raresalvage tbody').empty();
  $('#raresalvage tbody').html('<tr><td class="cost">Pending...</td></tr>');
  $('#raresalvage').show();

  partialStacks = {};
  itemPlacements = {};
  itemCounts = {};

  canner = false; //67176
  bandit = false; //67518
  itemsToCheckRarePrices = {};

  collections = 250;
  var tokenCheckURL = 'https://api.guildwars2.com/v2/tokeninfo?access_token=' + apiKey;

  message("Getting account permissions...");
  $.getJSON(tokenCheckURL, function(json) {

    if ($.inArray('characters', json.permissions) == -1) {
      message("Api key does not have permissions for characters.");
    } else if ($.inArray('characters', json.permissions) == -1) {
      message("Api key does not have permissions for inventories.");
    } else {
      getMaterials(apiKey);
    }

  }).fail(function(jqxhr, textStatus, error) {
    message("Failed to get account permissions.");
  });
}

function getBankListings(apiKey) {
  var bankURL = 'https://api.guildwars2.com/v2/account/bank?access_token=' + apiKey;
  message("Accessing bank...");
  $.getJSON(bankURL, function(json) {
    for (var i = 0; i < json.length; i++) {
      var item = json[i];
      addItem(item, 'Account bank');
    };
    getInventoryListings(apiKey);

  }).fail(function(jqxhr, textStatus, error) {
    message("Failed to access bank.");
  });
}

function getMaterials(apiKey) {

  var materialsURL = 'https://api.guildwars2.com/v2/account/materials?access_token=' + apiKey;
  message("Accessing materials...");
  $.getJSON(materialsURL, function(json) {
    for (var i = 0; i < json.length; i++) {
      var item = json[i];
      addItem(item, 'Material storage');
      if (item.count > collections) {
        collections = item.count;
      }
    };

    collections = Math.ceil(collections / 250) * 250;
    if (collections == 0) {
      collections = 250;
    }

    getBankListings(apiKey);

  }).fail(function(jqxhr, textStatus, error) {
    message("Failed to access materials.");
  });
}

function getInventoryListings(apiKey) {

  var characterListURL = 'https://api.guildwars2.com/v2/characters?access_token=' + apiKey;
  message("Getting character list...");
  $.getJSON(characterListURL, function(json) {
    recurseCharacter(json, apiKey);
  }).fail(function(jqxhr, textStatus, error) {
    message("Failed to get character list.");
  });

}

function recurseCharacter(characterList, apiKey) {
  if (characterList.length > 0) {
    var character = characterList.splice(0, 1);
    var characterURL = 'https://api.guildwars2.com/v2/characters/' + encodeURIComponent(character) + '?access_token=' + apiKey;
    message("Getting character " + character + "...");
    $.getJSON(characterURL, function(json) {
      for (var i = 0; i < json.bags.length; i++) {
        var bag = json.bags[i];
        if (bag) {
          if (bag.id == 67176) {
            canner = true;
          }
          if (bag.id == 67518) {
            bandit = true;
          }
          for (var j = 0; j < bag.inventory.length; j++) {
            var item = bag.inventory[j];
            addItem(item, character);
          };
        }
      };
      recurseCharacter(characterList, apiKey);
    }).fail(function(jqxhr, textStatus, error) {
      message("Failed to get character " + character + ".");
    });

  } else {
    processItems();
  }
}

function addItem(item, source) {
  if (item) {
    if (itemCounts[item.id]) {
      itemCounts[item.id] = itemCounts[item.id] + item.count;
    } else {
      itemCounts[item.id] = item.count;
    }
    if (item.count % 250 > 0 && item.count > 0) {
      var itemSource = {};
      itemSource.count = item.count;
      itemSource.source = source;
      var itemSources = partialStacks[item.id];
      if (!itemSources) {
        itemSources = [];
      }
      itemSources.push(itemSource);
      partialStacks[item.id] = itemSources;
    }
    var itemSource = {};
    itemSource.count = item.count;
    itemSource.source = source;
    var itemSources = itemPlacements[item.id];
    if (!itemSources) {
      itemSources = [];
    }
    itemSources.push(itemSource);
    itemPlacements[item.id] = itemSources;
  }
}

function addItemSource(itemSource, t) {
  for (index = 0; index < itemSource.length; ++index) {
    if (index > 0) {
      t.push('<tr>');
    }
    t.push('<td class="cost">');
    t.push(itemSource[index].count);
    t.push('</td>');
    t.push('<td class="cost">');
    t.push(itemSource[index].source);
    t.push('</td>');
    t.push('</tr>');
  }
}

function processItems() {
  getEctoCalc();
  var c = [];
  recurseBuildItemEntry(c, Object.keys(partialStacks));
  var r = [];
  recurseBuildCraftingEntry(r, Object.keys(itemCounts));
  var t = [];
  if (itemCounts[36041] >= 1000 && itemCounts[36041] > collections) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[36041].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/7AF3232140CB5DF159E4E54C2F092F69B5BD460F/499376.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[36041].length + '">');
    t.push('Exchange candy corn for ' + Math.floor(itemCounts[36041] / 1000) + 'x <a href="https://wiki.guildwars2.com/wiki/Candy_Corn_Cob">candy corn cobb</a>.');
    t.push('</td>');
    addItemSource(itemPlacements[36041], t);
  }

  if (itemCounts[46731] > collections) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[46731].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/1468C6A946BFF0A42CBD08A70E45F8F05851FED0/631480.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[46731].length + '">');
    if (itemCounts[66999] > 0) {
      t.push('Feed your <a href="http://wiki.guildwars2.com/wiki/Mawdrey_II">Mawdrey II</a> to get rid of ' + itemCounts[46731] + ' excess bloodstone dust. This will take ' + Math.ceil(0.9 * (itemCounts[46731] / 250)) + ' days.');
    } else {
      t.push('Obtain <a href="http://wiki.guildwars2.com/wiki/Mawdrey_II">Mawdrey II</a>.');
    }
    t.push('</td>');
    addItemSource(itemPlacements[46731], t);
  }

  if (itemCounts[46735] > collections) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[46735].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/DE4779014F27DE027BDBE761607B220923DB03D5/631484.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[46735].length + '">');
    if (itemCounts[68369] > 0) {
      t.push('Use your <a href="https://wiki.guildwars2.com/wiki/Star_of_Gratitude">Star of Gratitude</a> to get rid of ' + itemCounts[46735] + ' excess empyreal fragments. This will take ' + Math.ceil(0.9 * (itemCounts[46735] / 250)) + ' days.');
    } else {
      t.push('Obtain <a href="https://wiki.guildwars2.com/wiki/Star_of_Gratitude">Star of Gratitude</a>.');
    }
    t.push('</td>');
    addItemSource(itemPlacements[46735], t);
  }

  if (itemCounts[46733] > collections) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[46733].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/D53E69EFB3AFF4C85CC370AA32F1A6A61C03CCE8/631482.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[46733].length + '">');
    if (itemCounts[69887] > 0) {
      t.push('Feed your <a href="http://wiki.guildwars2.com/wiki/Princess">Princess</a> to get rid of ' + itemCounts[46733] + ' excess dragonite ore. This will take ' + Math.ceil(0.9 * (itemCounts[46733] / 250)) + ' days.');
    } else {
      t.push('Obtain <a href="http://wiki.guildwars2.com/wiki/Princess">Princess</a>.');
    }
    t.push("</td>");
    addItemSource(itemPlacements[46733], t);
  }

  if (itemCounts[43773] > collections) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[43773].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/10ABB44B459640C30CB8BFAEA9DFEAE19C6ECD67/603251.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[43773].length + '">');
    t.push('Convert your <a href="http://wiki.guildwars2.com/wiki/Quartz_Crystal">Quartz Crystals</a> to <a href="http://wiki.guildwars2.com/wiki/Charged_Quartz_Crystal">Charged Quartz Crystal</a>.');
    t.push("</td>");
    addItemSource(itemPlacements[43773], t);
  }

  if (!canner) {
    t.push('<tr><td class="icon" rowspan="1"><img src="');
    t.push('https://render.guildwars2.com/file/12C0B0AF58905AE9D8E796E0D5C664AC0144A696/866415.png');
    t.push('" /><td class="name" rowspan="1">');
    t.push('Complete <a href="http://wiki.guildwars2.com/wiki/Uncanny_Canner">Uncanny Canner</a> collection to get 20 slot bag.');
    t.push("</td>");
    t.push('<td class="cost">&nbsp;</td></tr>');
  }

  if (!bandit) {
    t.push('<tr><td class="icon" rowspan="1"><img src="');
    t.push('https://render.guildwars2.com/file/A36607CECB172039B022307E0E34BAB2EFDE51C6/619513.png');
    t.push('" /><td class="name" rowspan="1">');
    t.push('Complete <a href="http://wiki.guildwars2.com/wiki/Bandit_Weapons_Specialist">Bandit Weapons Specialist</a> collection to get 20 slot bag.');
    t.push("</td>");
    t.push('<td class="cost">&nbsp;</td></tr>');
  }

  if (itemCounts[45175] > 250 || (itemCounts[45175] > 0 && itemCounts[45175] % 5 == 0)) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[45175].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/1BF5D192EE5DAF97A7F4090461C450DA00F8FFAC/631148.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[45175].length + '">');
    t.push('Upgrade your ' + itemCounts[45175] + ' essences of luck with artificier and/or consume them.');
    t.push("</td>");
    addItemSource(itemPlacements[45175], t);
  }

  if (itemCounts[45176] > 250 || (itemCounts[45176] > 0 && itemCounts[45176] % 2 == 0)) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[45176].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/07450110280000435FBA2B4BE57DE6DCE86E22AC/631149.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[45176].length + '">');
    t.push('Upgrade your ' + itemCounts[45176] + ' essences of luck with artificier and/or consume them.');
    t.push("</td>");
    addItemSource(itemPlacements[45176], t);
  }

  if (itemCounts[45177] > 250 || (itemCounts[45177] > 0 && itemCounts[45177] % 2 == 0)) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[45177].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/4FA2D6CEF9039B402F2695CF2E740B4CF6F50753/631150.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[45177].length + '">');
    t.push('Upgrade your ' + itemCounts[45177] + ' essences of luck with artificier and/or consume them.');
    t.push("</td>");
    addItemSource(itemPlacements[45177], t);
  }

  if (itemCounts[45178] > 0) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[45178].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/DAB46301D2175B2CAAC4BACBA02F6A0A2F1DBEB8/631151.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[45178].length + '">');
    t.push('Consume your ' + itemCounts[45178] + ' essences of luck.');
    t.push("</td>");
    addItemSource(itemPlacements[45178], t);
  }

  if (itemCounts[20030] > 1) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[20030].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/6403060B50D222D6DF6B1479A34EA7930A401914/66581.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[20030].length + '">');
    t.push('Destroy ' + (itemCounts[20030] - 1) + ' excess <a href="http://wiki.guildwars2.com/wiki/Hall_of_Monuments_Portal_Stone">Hall of Monuments Portal Stones</a>.');
    t.push("</td>");
    addItemSource(itemPlacements[20030], t);
  }

  if (itemCounts[19997] > 0) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[19997].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/433FE6E01CDA243EDBDC24F96F06D5FC2FAF195A/66584.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[19997].length + '">');
    t.push('Convert to <a href="http://wiki.guildwars2.com/wiki/Enchanted_Reward_Boost">Enchanted Reward Boosts</a>.');
    t.push("</td>");
    addItemSource(itemPlacements[19997], t);
  }

  if (itemCounts[20006] > 0) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[20006].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/F1E6C29D6A783A9563E5D516532C6E079C5A6069/66669.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[20006].length + '">');
    t.push('Convert to <a href="http://wiki.guildwars2.com/wiki/Enchanted_Reward_Boost">Enchanted Reward Boosts</a>.');
    t.push("</td>");
    addItemSource(itemPlacements[20006], t);
  }

  if (itemCounts[20008] > 0) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[20008].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/46089D5AF06CEBA30DF72DBEB673BAC31D614A7E/66670.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[20008].length + '">');
    t.push('Convert to <a href="http://wiki.guildwars2.com/wiki/Enchanted_Reward_Boost">Enchanted Reward Boosts</a>.');
    t.push("</td>");
    addItemSource(itemPlacements[20008], t);
  }

  if (itemCounts[48951] > 0) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[48951].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/BA031F002EE7F00CC3D9D6D4770DDC33B84A723D/674830.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[48951].length + '">');
    t.push('Convert to <a href="http://wiki.guildwars2.com/wiki/Enchanted_Reward_Boost">Enchanted Reward Boosts</a>.');
    t.push("</td>");
    addItemSource(itemPlacements[48951], t);
  }

  if (itemCounts[19999] > 0) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[19999].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/349B73A33D4E289197CA03D652062202279D376A/797800.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[19999].length + '">');
    t.push('Convert to <a href="http://wiki.guildwars2.com/wiki/Enchanted_Reward_Boost">Enchanted Reward Boosts</a>.');
    t.push("</td>");
    addItemSource(itemPlacements[19999], t);
  }

  if (itemCounts[20013] > 0) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[20013].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/D813F1C095BBA403B4D9682C5D1AFCE0CA98239E/434413.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[20013].length + '">');
    t.push('Convert to <a href="http://wiki.guildwars2.com/wiki/Enchanted_Combat_Boost">Enchanted Combat Boosts</a>.');
    t.push("</td>");
    addItemSource(itemPlacements[20013], t);
  }

  if (itemCounts[20015] > 0) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[20015].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/084BE7C2740C735DEA6F0FA4A6C4CA0639B49F4B/434414.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[20015].length + '">');
    t.push('Convert to <a href="http://wiki.guildwars2.com/wiki/Enchanted_Combat_Boost">Enchanted Combat Boosts</a>.');
    t.push("</td>");
    addItemSource(itemPlacements[20015], t);
  }

  if (itemCounts[20016] > 0) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[20016].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/9D73A9FFD9E99376A445C7CEE7DEA40F72F05B3F/434415.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[20016].length + '">');
    t.push('Convert to <a href="http://wiki.guildwars2.com/wiki/Enchanted_Combat_Boost">Enchanted Combat Boosts</a>.');
    t.push("</td>");
    addItemSource(itemPlacements[20016], t);
  }

  if (itemCounts[20010] > 0) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[20010].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/0439C04FE14D6AEC802A47139F78DD6729EC63A0/434412.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[20010].length + '">');
    t.push('Convert to <a href="http://wiki.guildwars2.com/wiki/Enchanted_Combat_Boost">Enchanted Combat Boosts</a>.');
    t.push("</td>");
    addItemSource(itemPlacements[20010], t);
  }

  if (itemCounts[67826] > 0 && itemCounts[67777] > 0) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[67826].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/0C0D0D803F9F6F7402449EB70CE6410909F33453/526107.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[67826].length + '">');
    t.push('Dig up Lost Bandit Chests with your ' + itemCounts[67826] + ' <a href="http://wiki.guildwars2.com/wiki/Silverwastes_Shovel">Silverwastes Shovels</a> and unlock them with <a href="http://wiki.guildwars2.com/wiki/Bandit_Skeleton_Key">Bandit Skeleton Keys</a>.');
    t.push("</td>");
    addItemSource(itemPlacements[67826], t);
  }

  if (itemCounts[67777] > 0) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[67777].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/332FF8697F27CEC0A599A008C901ACD8273E0C1E/65724.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[67777].length + '">');
    t.push('Use your ' + itemCounts[67777] + ' <a href="http://wiki.guildwars2.com/wiki/Bandit_Skeleton_Key">Bandit Skeleton Keys</a> to open Lost Bandit Chests is Silverwastes or Found Bandit Chest in your home instance.');
    t.push("</td>");
    addItemSource(itemPlacements[67777], t);
  }

  if (itemCounts[67780] > 0) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[67780].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/9577036D9BF8A120CD02BCF110DDFA416303026A/65712.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[67780].length + '">');
    t.push('Use your ' + itemCounts[67780] + ' <a href="https://wiki.guildwars2.com/wiki/Tarnished_Key">Tarnished Key</a>s to open Tarnished chest in Silverwastes.');
    t.push("</td>");
    addItemSource(itemPlacements[67780], t);
  }

  if (itemCounts[67818] > 0) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[67818].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/08F2E5DE35B66373E6A130610AEAE0E7A0241631/904671.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[67818].length + '">');
    t.push('Use your ' + itemCounts[67818] + ' <a href="http://wiki.guildwars2.com/wiki/Experimental_Mordrem_Extraction_Device">Experimental Mordrem Extraction Device</a> during breach event in Silverwastes.');
    t.push("</td>");
    addItemSource(itemPlacements[67818], t);
  }

  if (itemCounts[67979] > 0 || (itemCounts[67981] > 24 && itemCounts[67777] > 0)) {
    t.push('<tr><td class="icon" rowspan="1"><img src="');
    t.push('https://render.guildwars2.com/file/4BD8E5740C15F3B4AA059794C27FB10B4403A1F6/915567.png');
    t.push('" /><td class="name" rowspan="1">');
    if (itemCounts[67981] > 24 && itemCounts[67777] > 0) {
      t.push('Use your <a href="https://wiki.guildwars2.com/wiki/Essence_of_Nightmares">Essences of Nightmares</a> to create Keys of Greater Nightmare.<br />');
    }
    t.push('Use your ' + itemCounts[67979] + ' <a href="https://wiki.guildwars2.com/wiki/Key_of_Greater_Nightmares">Keys of Greater Nightmare</a> to open Greater Nightmare Pod.');
    t.push("</td>");
    t.push('<td class="cost">&nbsp;</td></tr>');
  }

  if (itemCounts[66624] > 0) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[66624].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/A6F57A2C946B2A02062AC0A9452703505CF8B3BE/831466.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[66624].length + '">');
    t.push('Use your ' + itemCounts[66624] + ' <a href="http://wiki.guildwars2.com/wiki/Zephyrite_Lockpick">Zephyrite Lockpicks</a> to open Burried Locked Chests in Dry Top.');
    t.push("</td>");
    addItemSource(itemPlacements[66624], t);
  }

  if (itemCounts[48716] > 0 || itemCounts[48717] > 4) {
    t.push('<tr><td class="icon" rowspan="1"><img src="');
    t.push('https://render.guildwars2.com/file/E5CEF7FA72F1703EF039040AA078A1091C7FA27C/643185.png');
    t.push('" /><td class="name" rowspan="1">');
    if (itemCounts[48717] > 4) {
      t.push('Turn ' + 5 * Math.floor(itemCounts[48717] / 5) + ' Aetherkey Pieces into a <a href="https://wiki.guildwars2.com/wiki/Completed_Aetherkey">Completed Aetherkey</a>.<br />');
    }
    t.push('Use Completed Aetherkey to open chests in <a href="https://wiki.guildwars2.com/wiki/Aetherpath_(Twilight_Arbor)">Aetherpath of Twilight Arbor</a>.');
    t.push("</td>");
    t.push('<td class="cost">&nbsp;</td></tr>');
  }

  if (itemCounts[66608] > 9) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[66608].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/4AA6F8CB30973B9A6E4C310124EFB5BFF42036E5/63273.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[66608].length + '">');
    t.push('Sift throught silky sand.');
    t.push("</td>");
    addItemSource(itemPlacements[66608], t);
  }

  //43485 - wxp mini
  //45045 - wxp large

  //41741 - bonfire
  //20001 - karma booster

  //67836 - celebration
  //45003 - birthday booster

  var wxpboost = (itemCounts[43485] || 0) * 0.25 + (itemCounts[45045] || 0);
  var karmaboost = (itemCounts[41741] || 0) + (itemCounts[20001] || 0);
  var celebboost = (itemCounts[67836] || 0) + 12 * (itemCounts[45003] || 0);

  if (wxpboost > 0 && celebboost > 0) {
    t.push('<tr><td class="icon" rowspan="1"><img src="');
    t.push('https://render.guildwars2.com/file/47924193059EA402C94F3352700A9193CE0A0EFC/591608.png');
    t.push('" /><td class="name" rowspan="1">');
    t.push('You have ' + wxpboost + " hours of WvW Experience boosters");
    if (karmaboost > 0) {
      t.push(", " + karmaboost + " hours of karma boosters");
    }
    t.push(" and " + celebboost + ' hours of celebration boosters.<br />May I suggest some brainless fun in <a href="http://wiki.guildwars2.com/wiki/Edge_of_the_Mists">Edge of the Mists</a>?');
    t.push("</td>");
    t.push('<td class="cost">&nbsp;</td></tr>');
  }


  if (itemCounts[71627] > 1) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[71627].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/E079346EA36BFBBD752B0A18B1A976962C15EEF5/222666.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[71627].length + '">');
    t.push('Spend some time in Verdant Brink doing events and consuming boost potions.');
    t.push("</td>");
    addItemSource(itemPlacements[71627], t);
  }

  if (itemCounts[75024] > 1) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[75024].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/D43F2110F4D2BF5B0594A2CD562CC371F8053C58/1206832.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[75024].length + '">');
    t.push('Spend some time in Auric Basin doing events and consuming boost potions.');
    t.push("</td>");
    addItemSource(itemPlacements[75024], t);
  }

  if (itemCounts[71207] > 1) {
    t.push('<tr><td class="icon" rowspan="' + itemPlacements[71207].length + '"><img src="');
    t.push('https://render.guildwars2.com/file/5E41513A491AA1E11A04D99C5BA13B3D1439687D/1206835.png');
    t.push('" /><td class="name" rowspan="' + itemPlacements[71207].length + '">');
    t.push('Spend some time in Tangeld Depths doing events and consuming boost potions.');
    t.push("</td>");
    addItemSource(itemPlacements[71207], t);
  }
  $('#tips tbody').html(t.join(""));
  $('#tips').show();
  message("Done with misc tips.");
}

function recipeItemInfo(r, keys, recipes, itemIds) {
  var itemURL = 'https://api.guildwars2.com/v2/items?ids=' + itemIds.join(',');
  message("Getting details for items " + itemIds.join(',') + "...");
  $.getJSON(itemURL, function(json) {
    for (var i = 0; i < json.length; i++) {
      r.push('<tr><td class="icon"><img src="');
      r.push(json[i].icon);
      r.push('" /><td class="name">');
      r.push(json[i].name);
      r.push('</td></tr>');
    };
    recurseRecipeList(r, keys, recipes);
  }).fail(function(jqxhr, textStatus, error) {
    message("Failed to get details for item " + itemIds.join(',') + ".");
    r.push('<tr><td class="icon">?<td class="name">');
    r.push('Mystery items ' + itemIds.join(','));
    r.push('</td></tr>');
    recurseRecipeList(r, keys, recipes);
  });
}

function recurseRecipeList(r, keys, recipes) {
  if (recipes.length > 0) {
    var recipeIds = recipes.splice(0, 199);
    var recipeURL = 'https://api.guildwars2.com/v2/recipes?ids=' + recipeIds.join(',');
    message("Getting recipes " + recipeIds.join(',') + "...");
    $.getJSON(recipeURL, function(json) {
      var itemIds = [];
      for (var i = 0; i < json.length; i++) {
        if (json[i].ingredients.length < 2) {
          itemIds.push(json[i].output_item_id);
        }
      };
      if (itemIds.length > 0) {
        recipeItemInfo(r, keys, recipes, itemIds);
      } else {
        recurseRecipeList(r, keys, recipes);
      }
    }).fail(function(jqxhr, textStatus, error) {
      message("Failed to get recipes " + recipeIds.join(',') + ".");
    });
  } else {
    recurseBuildCraftingEntry(r, keys);
  }
}

function recurseBuildCraftingEntry(r, keys) {
  if (keys.length > 0) {
    var itemId = keys.splice(0, 1);
    if (itemCounts[itemId] > collections) {
      var recipeURL = 'https://api.guildwars2.com/v2/recipes/search?input=' + itemId;
      message("Getting recipes for item " + itemId + "...");
      $.getJSON(recipeURL, function(json) {
        if (json.length > 0) {
          recurseRecipeList(r, keys, json);
        } else {
          recurseBuildCraftingEntry(r, keys);
        }
      }).fail(function(jqxhr, textStatus, error) {
        message("Failed to get recipes for item " + itemId + ".");
      });
    } else {
      recurseBuildCraftingEntry(r, keys);
    }
  } else {
    $('#crafts tbody').html(r.join(""));
    $('#crafts').show();
    message("Done with crafting tips.");
  }
}

function recurseBuildItemEntry(c, keys) {
  if (keys.length > 0) {
    var itemIds = keys.splice(0, 199); // 200 items limit per api call
    var itemURL = 'https://api.guildwars2.com/v2/items?ids=' + itemIds.join(",");
    message("Getting details for items " + itemIds.join(",") + "...");
    $.getJSON(itemURL, function(json) {
      for (var i = 0; i < json.length; i++) {
        var itemId = json[i].id;
        var itemSource = partialStacks[itemId];
        if (itemSource.length > 1) {
          if ($.inArray(json[i].type, ['Armor', 'Back', 'Gathering', 'Tool', 'Trinket', 'Weapon', 'Bag']) == -1) {
            if ($('#consumables').is(':checked') && $.inArray(json[i].type, ['Consumable']) > -1 && $.inArray(json[i].details.type, ['Food', 'Utility']) > -1) {
              continue;
            }
            var total = 0;
            for (index = 0; index < itemSource.length; ++index) {
              total += itemSource[index].count;
            }
            c.push('<tr><td class="icon" rowspan="' + itemSource.length + '"><img src="');
            c.push(json[i].icon);
            c.push('" /><td class="name" rowspan="' + itemSource.length + '">');
            c.push(total + ' ' + json[i].name);
            c.push('</td>');
            for (index = 0; index < itemSource.length; ++index) {
              if (index > 0) {
                c.push('<tr>');
              }
              c.push('<td class="cost">');
              c.push(itemSource[index].count);
              c.push('</td>');
              c.push('<td class="cost">');
              c.push(itemSource[index].source);
              c.push('</td>');
              c.push('</tr>');
            }
          }
        }
      }
      recurseBuildItemEntry(c, keys);
    }).fail(function(jqxhr, textStatus, error) {
      //alert( itemId + "@" + JSON.stringify(itemSource) );
      message("Failed to get details for items " + itemIds.join(",") + ".");
      recurseBuildItemEntry(c, keys);
    });


  } else {
    $('#items tbody').html(c.join(""));
    $('#items').show();
    message("Done with stacking tips.");
  }
}


function getEctoCalc(c) {
  ectoPrice = 0;
  message('Querying ecto price on Trading post.');
  $.getJSON("https://api.guildwars2.com/v2/commerce/prices/19721", function(data) {
    var salvage_price = 0.10496;
    var ecto_chance = 0.875;
    var tp_tax = 0.85;

    ectoPrice = (data.sells.unit_price * tp_tax * ecto_chance - salvage_price) / tp_tax;

    var gold = Math.floor(ectoPrice / 10000);
    var silver = Math.floor((ectoPrice - 10000 * gold) / 100);
    var copper = Math.floor(ectoPrice - 10000 * gold - 100 * silver);

    $("#price .gold").text(gold);
    $("#price .silver").text(silver);
    $("#price .copper").text(copper);

    recurseBuildRareItemEntry([], itemPlacements);
  }).fail(function(jqxhr, textStatus, error) {
    message('Failed to query ecto price on Trading post.');
  });
}

function recurseBuildRareItemEntry(c, itemSources) {

  if (itemSources.length > 0) {
    var itemSourceSlice = itemSources.splice(0, 199); // 200 items limit per api call
    var itemIds = [];
    for (var i = 0; i < itemSourceSlice.length; i++) {
      itemIds.push(itemSourceSlice[i].itemId);
    };
    var itemURL = 'https://api.guildwars2.com/v2/items?ids=' + itemIds.join(",");
    message("Getting details for items " + itemIds.join(",") + "...");

    $.getJSON(itemURL, function(json) {
      for (var j = 0; j < itemSourceSlice.length; j++) {
        for (var i = 0; i < json.length; i++) {
          if (json[i].id == itemSourceSlice[j].itemId) {
            if ($.inArray(json[i].type, ['Armor', 'Back', 'Trinket', 'Weapon']) != -1 && json[i].rarity == 'Rare' && json[i].level > 77 && $.inArray('NoSalvage', json[i].flags) == -1) {
              c.push('<tr><td class="icon"><img src="');
              c.push(json[i].icon);
              c.push('" /><td class="name">');
              c.push(json[i].name);
              c.push('</td>');
              c.push('<td class="cost">');
              c.push(itemSourceSlice[j].source);
              c.push('</td>');
              c.push('<td class="name ' + itemSourceSlice[j].itemId + '" class="cost">?</td>');
              addItemSource(itemPlacements[itemSourceSlice[j].itemId], c);
              itemsToCheckRarePrices.push(itemSourceSlice[j].itemId);
            }
          }
        }
      };
      recurseBuildRareItemEntry(c, itemSources);
    }).fail(function(jqxhr, textStatus, error) {
      //alert( itemId + "@" + JSON.stringify(itemSource) );
      message("Failed to get details for items " + itemIds.join(",") + ".");
      recurseBuildRareItemEntry(c, itemSources);
    });
  } else {
    if (c.length == 0) {
      $('#raresalvage tbody').html('<tr><td class="cost">Nothing</td></tr>');
    } else {
      $('#raresalvage tbody').html(c.join(""));
    }
    $('#raresalvage').show();

    fetchItemPricesRarePrices(itemsToCheckRarePrices);
  }
}

function fetchItemPricesRarePrices(items) {

  if (items.length > 0) {

    var itemSlice = items.splice(0, 199); // 200 items limit per api call
    var itemURL = 'https://api.guildwars2.com/v2/commerce/prices?ids=' + itemSlice.join(",");
    message("Getting prices for items " + itemSlice.join(",") + "...");
    $.getJSON(itemURL, function(json) {
      for (var j = 0; j < json.length; j++) {
        $("." + json[j].id).each(function() {
          var gold = Math.floor(json[j].sells.unit_price / 10000);
          var silver = Math.floor((json[j].sells.unit_price - 10000 * gold) / 100);
          var copper = Math.floor(json[j].sells.unit_price - 10000 * gold - 100 * silver);

          var todo = '';

          if (ectoPrice > json[j].sells.unit_price) {
            todo = 'Salvage!'
          } else {
            todo = 'Sell!'
          }

          $(this).html(
            todo + ' <span class="gold">' + gold + '</span> <img src="../common/gold.png" /> <span class="silver">' + silver + '</span> <img src="../common/silver.png" /> <span class="copper">' + copper + '</span> <img src="../common/copper.png" />'
          );
        });
      };
      fetchItemPricesRarePrices(items);
    }).fail(function(jqxhr, textStatus, error) {
      //alert( itemId + "@" + JSON.stringify(itemSource) );
      message("Failed to get prices for items " + itemSlice.join(",") + ".");
      fetchItemPricesRarePrices(items);
    });
  } else {
    message("Done with salvaging tips.");
  }
}