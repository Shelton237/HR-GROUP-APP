"use strict";
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      "ALTER TABLE users MODIFY role ENUM('Admin','RH','Manager','Lecture','Agent','Operateur') NOT NULL DEFAULT 'Lecture'"
    );
  },
  down: async (queryInterface) => {
    await queryInterface.sequelize.query("UPDATE users SET role = 'RH' WHERE role = 'Operateur'");
    await queryInterface.sequelize.query(
      "ALTER TABLE users MODIFY role ENUM('Admin','RH','Manager','Lecture','Agent') NOT NULL DEFAULT 'Lecture'"
    );
  },
};
